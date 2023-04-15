import { injected, token } from "brandi";
import { Knex } from "knex";
import { Logger } from "winston";
import { status } from "@grpc/grpc-js";
import { ErrorWithStatus, LOGGER_TOKEN } from "../../utils";
import { KNEX_INSTANCE_TOKEN } from "./knex";
import { ClassificationType } from "../../proto/gen/ClassificationType";

export enum ClassificationTaskStatus {
  REQUESTED = 0,
  DONE = 1,
}

export class ClassificationTask {
  constructor(
    public id: number,
    public ofImageId: number,
    public classificationType: ClassificationType,
    public requestTime: number,
    public status: ClassificationTaskStatus
  ) {}
}

export interface ClassificationTaskDataAccessor {
  createClassificationTask(
    ofImageId: number,
    clasificationType: ClassificationType,
    requestTime: number,
    taskStatus: ClassificationTaskStatus
  ): Promise<number>;
  getClassificationTaskWithXLock(
    id: number
  ): Promise<ClassificationTask | null>;
  getRequestedClassificationTaskCountOfImageId(
    ofImageId: number
  ): Promise<number>;
  updateClassificationTask(
    classificationTask: ClassificationTask
  ): Promise<void>;
  withTransaction<T>(
    executeFunc: (dm: ClassificationTaskDataAccessor) => Promise<T>
  ): Promise<T>;
}

const TabNameModelServiceClassificationTask =
  "model_service_classification_task_tab";
const ColNameModelServiceClassificationTaskClassificationTaskId =
  "classification_task_id";
const ColNameModelServiceClassificationTaskOfImageId = "of_image_id";
const ColNameModelServiceClassificationTaskClassificationType = "classification_type";
const ColNameModelServiceClassificationTaskRequestTime = "request_time";
const ColNameModelServiceClassificationTaskStatus = "status";

export class ClassificationTaskDataAccessorImpl
  implements ClassificationTaskDataAccessor
{
  constructor(
    private readonly knex: Knex<any, any[]>,
    private readonly logger: Logger
  ) {}

  public async createClassificationTask(
    ofImageId: number,
    clasificationType: ClassificationType,
    requestTime: number,
    taskStatus: ClassificationTaskStatus
  ): Promise<number> {
    try {
      const rows = await this.knex
        .insert({
          [ColNameModelServiceClassificationTaskOfImageId]: ofImageId,
          [ColNameModelServiceClassificationTaskClassificationType]: clasificationType,
          [ColNameModelServiceClassificationTaskRequestTime]: requestTime,
          [ColNameModelServiceClassificationTaskStatus]: taskStatus,
        })
        .returning([ColNameModelServiceClassificationTaskClassificationTaskId])
        .into(TabNameModelServiceClassificationTask);
      return +rows[0][
        ColNameModelServiceClassificationTaskClassificationTaskId
      ];
    } catch (error) {
      this.logger.error("failed to create detection task", { error });
      throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
    }
  }

  public async getClassificationTaskWithXLock(
    id: number
  ): Promise<ClassificationTask | null> {
    try {
      const rows = await this.knex
        .select()
        .from(TabNameModelServiceClassificationTask)
        .where(
          ColNameModelServiceClassificationTaskClassificationTaskId,
          "=",
          id
        )
        .forUpdate();
      if (rows.length === 0) {
        this.logger.debug(
          "no classification task with classification_task_id found",
          { classificationTaskId: id }
        );
        return null;
      }
      if (rows.length > 1) {
        this.logger.debug(
          "more than one classification task with classification_task_id found",
          { cassificationTaskId: id }
        );
        throw new ErrorWithStatus(
          `more than one classification task with classification_task_id ${id}`,
          status.INTERNAL
        );
      }
      return this.getClassificationTaskFromRow(rows[0]);
    } catch (error) {
      this.logger.error("failed to get classification task", { error });
      throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
    }
  }

  public async getRequestedClassificationTaskCountOfImageId(
    ofImageId: number
  ): Promise<number> {
    try {
      const rows = await this.knex
        .count()
        .from(TabNameModelServiceClassificationTask)
        .where(ColNameModelServiceClassificationTaskOfImageId, "=", ofImageId)
        .andWhere(
          ColNameModelServiceClassificationTaskRequestTime,
          "=",
          ClassificationTaskStatus.DONE
        );
      return +(rows[0] as any)["count"];
    } catch (error) {
      this.logger.error(
        "failed to get requested classification task count of image_id",
        { ofImageId, error }
      );
      throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
    }
  }

  public async updateClassificationTask(
    classificationTask: ClassificationTask
  ): Promise<void> {
    try {
      await this.knex
        .table(TabNameModelServiceClassificationTask)
        .update({
          [ColNameModelServiceClassificationTaskOfImageId]: classificationTask.ofImageId,
          [ColNameModelServiceClassificationTaskClassificationType]: classificationTask.classificationType,
          [ColNameModelServiceClassificationTaskRequestTime]:
            classificationTask.requestTime,
          [ColNameModelServiceClassificationTaskStatus]: classificationTask.status,
        })
        .where(
          ColNameModelServiceClassificationTaskClassificationTaskId,
          "=",
          classificationTask.id
        )
        .into(TabNameModelServiceClassificationTask);
    } catch (error) {
      this.logger.error("failed to update classification task", {
        classificationTask,
        error,
      });
      throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
    }
  }

  public async withTransaction<T>(
    executeFunc: (dm: ClassificationTaskDataAccessor) => Promise<T>
  ): Promise<T> {
    return this.knex.transaction(async (tx) => {
      const txDataAccessor = new ClassificationTaskDataAccessorImpl(
        tx,
        this.logger
      );
      return executeFunc(txDataAccessor);
    });
  }

  private getClassificationTaskFromRow(
    row: Record<string, any>
  ): ClassificationTask {
    return new ClassificationTask(
      +row[ColNameModelServiceClassificationTaskClassificationTaskId],
      +row[ColNameModelServiceClassificationTaskOfImageId],
      +row[ColNameModelServiceClassificationTaskClassificationType],
      +row[ColNameModelServiceClassificationTaskRequestTime],
      +row[ColNameModelServiceClassificationTaskStatus]
    );
  }
}

injected(ClassificationTaskDataAccessorImpl, KNEX_INSTANCE_TOKEN, LOGGER_TOKEN);

export const CLASSIFICATION_TASK_DATA_ACCESSOR_TOKEN =
  token<ClassificationTaskDataAccessor>("ClassificationTaskDataAccessor");
