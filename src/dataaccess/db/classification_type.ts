import { status } from "@grpc/grpc-js"
import { injected, token } from "brandi";
import { Knex } from "knex";
import { Logger } from "winston";
import { ErrorWithStatus, LOGGER_TOKEN } from "../../utils";
import { KNEX_INSTANCE_TOKEN } from "./knex";

export class ClassificationType {
	constructor(
		public classificationTypeId: number,
		public displayName: string
	) { }
}



export interface ClassificationTypeDataAccessor {
	getClassificationTypeList(): Promise<ClassificationType[]>;
	getClassificationType(
		id: number
	): Promise<ClassificationType | null>
	getClassificationTypeByDisplayName(displayName: string): Promise<ClassificationType | null>
}

const TabNameModelServiceClassificationType = "model_service_classification_type_tab";
const ColNameModelServiceClassificationTypeClassificationTypeId = "classification_type_id";
const ColNameModelServiceClassificationTaskDisplayName = "display_name";

export class ClassificationTypeDataAccessorImpl implements ClassificationTypeDataAccessor {
	constructor(
		private readonly knex: Knex<any, any[]>,
		private readonly logger: Logger
	) { }

	public async getClassificationTypeList(): Promise<ClassificationType[]> {
		try {
			const rows = await this.knex
				.select()
				.from(TabNameModelServiceClassificationType)
				.orderBy(ColNameModelServiceClassificationTypeClassificationTypeId, "asc");
			return rows.map((row) => this.getClassificationTypeFromRow(row))
		} catch (error) {
			this.logger.error("failed to get classification type list", { error });
			throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL)
		}
	}

	public async getClassificationType(
		id: number
	): Promise<ClassificationType | null> {
		try {
			const rows = await this.knex
				.select()
				.from(TabNameModelServiceClassificationType)
				.where(
					ColNameModelServiceClassificationTypeClassificationTypeId,
					"=",
					id
				);
			if (rows.length === 0) {
				this.logger.debug(
					"no classification type with classification_type_id found",
					{ classificationTypeId: id }
				);
				return null;
			}
			if (rows.length > 1) {
				this.logger.debug(
					"more than one classification type with classification_type_id found",
					{ classificationTypeId: id }
				);
				throw new ErrorWithStatus(
					`more than one classification type with classification_type_id ${id}`,
					status.INTERNAL
				);
			}
			
			return this.getClassificationTypeFromRow(rows[0]);
		} catch (error) {
			this.logger.error("failed to get classification type", { error });
				throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
		}
	}

	public async getClassificationTypeByDisplayName(displayName: string): Promise<ClassificationType | null> {
		let rows: Record<string, any>[];
		try {
			rows = await this.knex
				.select()
				.from(TabNameModelServiceClassificationType)
				.where(
					ColNameModelServiceClassificationTaskDisplayName,
					'like',
					displayName
				);
		} catch (error) {
			this.logger.error("failed to get classification type", {
				displayName: displayName,
				error,
			});
			throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
		}

		if (rows.length == 0) {
			this.logger.info("no classification type with display_name found",
				{ displayName: displayName }
			);
			return null;
		}
		if (rows.length > 1) {
			this.logger.error("more than one classification type with display_name found",
				{ displayName: displayName }
			);
			throw new ErrorWithStatus(
				"more than one classification type with display_name found",
				status.INTERNAL
			);
		}

		return this.getClassificationTypeFromRow(rows[0]);
	}

	private getClassificationTypeFromRow(row: Record<string, any>): ClassificationType {
		return new ClassificationType(
			+row[ColNameModelServiceClassificationTypeClassificationTypeId],
			row[ColNameModelServiceClassificationTaskDisplayName],
		);
	}
}

injected(
	ClassificationTypeDataAccessorImpl,
	KNEX_INSTANCE_TOKEN,
	LOGGER_TOKEN
);

export const CLASSIFICATION_TYPE_DATA_ACCESSOR_TOKEN = token<ClassificationTypeDataAccessor>(
	"ClassificationTypeDataAccessor"
);