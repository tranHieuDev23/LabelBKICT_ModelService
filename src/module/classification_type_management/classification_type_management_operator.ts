import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import { Logger } from "winston";
import { 
    ClassificationType,
    ClassificationTypeDataAccessor,
    CLASSIFICATION_TYPE_DATA_ACCESSOR_TOKEN
} from "../../dataaccess/db";
import { ErrorWithStatus, LOGGER_TOKEN, Timer, TIMER_TOKEN } from "../../utils";

export interface ClassificationTypeManagementOperator {
    getClassificationTypeList(): Promise<ClassificationType[]>;
    getClassificationType(classificationTypeId: number): Promise<ClassificationType>;
}

export class ClassificationTypeManagementOperatorImpl implements ClassificationTypeManagementOperator {
    constructor(
        private readonly classificationTypeDM: ClassificationTypeDataAccessor,
        private readonly timer: Timer,
        private readonly logger: Logger
    ) {}

    public async getClassificationTypeList(): Promise<ClassificationType[]> {
        return await this.classificationTypeDM.getClassificationTypeList();
    }

    public async getClassificationType(classificationTypeId: number): Promise<ClassificationType> {
        const classificationType =  await this.classificationTypeDM.getClassificationType(classificationTypeId);
        
        if (classificationType == null) {
            this.logger.error("no classification type with classification_type_id found",
                { classificationTypeId: classificationTypeId }
            );
            throw new ErrorWithStatus(
                `no classification type with classification_type_id ${classificationTypeId} found`,
                status.NOT_FOUND
                );
        }
        return classificationType;
    }
}

injected(
    ClassificationTypeManagementOperatorImpl,
    CLASSIFICATION_TYPE_DATA_ACCESSOR_TOKEN,
    TIMER_TOKEN,
    LOGGER_TOKEN
);

export const CLASSIFICATION_TYPE_MANAGEMENT_OPERATOR_TOKEN =
    token<ClassificationTypeManagementOperator>("ClassificationTypeManagementOperator")