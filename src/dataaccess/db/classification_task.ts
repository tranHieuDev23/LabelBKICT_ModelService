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
    public ofClassificationTypeId: number,
    public requestTime: number,
    public status: ClassificationTaskStatus
  ) {}
}

export class ClassificationTaskListFilterOptions {
  public ofImageIdList: number[] = [];
  public ofClassificationTypeIdList: number[] = [];
  public statusList: ClassificationTaskStatus[] = [];
}

export enum ClassificationTaskListSortOrder {
  ID_ASCENDING = 0,
  ID_DESCENDING = 1,
  REQUEST_TIME_ASCENDING = 2,
  REQUEST_TIME_DESCENDING = 3
}

export interface ClassificationTaskDataAccessor {
  createClassificationTask(
    ofImageId: number,
    ofClasificationTypeId: number,
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
  countClassificationTask(filterOptions: ClassificationTaskListFilterOptions): Promise<number>;
  getClassificationTaskList(
    offset: number,
    limit: number,
    filterOptions: ClassificationTaskListFilterOptions,
    sortOrder: ClassificationTaskListSortOrder
  ): Promise<ClassificationTask[]>
  withTransaction<T>(
    executeFunc: (dm: ClassificationTaskDataAccessor) => Promise<T>
  ): Promise<T>;
}

const TabNameModelServiceClassificationTask =
  "model_service_classification_task_tab";
const ColNameModelServiceClassificationTaskClassificationTaskId =
  "classification_task_id";
const ColNameModelServiceClassificationTaskOfImageId = "of_image_id";
const ColNameModelServiceClassificationTaskOfClassificationTypeId = "of_classification_type_id";
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
    ofClasificationTypeId: number,
    requestTime: number,
    taskStatus: ClassificationTaskStatus
  ): Promise<number> {
    try {
      const rows = await this.knex
        .insert({
          [ColNameModelServiceClassificationTaskOfImageId]: ofImageId,
          [ColNameModelServiceClassificationTaskOfClassificationTypeId]: ofClasificationTypeId,
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
          [ColNameModelServiceClassificationTaskOfClassificationTypeId]: classificationTask.ofClassificationTypeId,
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

  public async countClassificationTask(filterOptions: ClassificationTaskListFilterOptions): Promise<number> {
    try {
      let queryBuilder = this.knex.count().from(TabNameModelServiceClassificationTask);
      queryBuilder = queryBuilder.where((qb) => {
          return this.getClassificationTaskListFilterOptionsWhereClause(qb, filterOptions);
      });
      const rows = (await queryBuilder) as any[];
      return +rows[0]["count"];
  } catch (error) {
      this.logger.error("failed to get classification task count", { filterOptions, error });
      throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
  }
  }

  public async getClassificationTaskList(
    offset: number,
    limit: number,
    filterOptions: ClassificationTaskListFilterOptions,
    sortOrder: ClassificationTaskListSortOrder
  ): Promise<ClassificationTask[]> {
    try {
      let queryBuilder = this.knex
        .select()
        .from(TabNameModelServiceClassificationTask)
        .offset(offset)
        .limit(limit);
      queryBuilder = this.applyClassificationTaskListOrderByClause(queryBuilder, sortOrder);
      queryBuilder = queryBuilder.where((qb) => {
        return this.getClassificationTaskListFilterOptionsWhereClause(qb, filterOptions);
      });
      const rows = await queryBuilder;
      return rows.map((row) => this.getClassificationTaskFromRow(row));
    } catch (error) {
      this.logger.error("failed to get classification task list", { offset, limit, filterOptions, sortOrder, error });
      throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
    }
  }

  private getClassificationTaskListFilterOptionsWhereClause(
    qb: Knex.QueryBuilder,
    filterOptions: ClassificationTaskListFilterOptions
  ): Knex.QueryBuilder {
    qb = qb.whereIn(ColNameModelServiceClassificationTaskOfImageId, filterOptions.ofImageIdList)
    qb = qb.whereIn(ColNameModelServiceClassificationTaskOfClassificationTypeId, filterOptions.ofClassificationTypeIdList);
    qb = qb.whereIn(ColNameModelServiceClassificationTaskStatus, filterOptions.statusList);
    return qb;
  }

  private applyClassificationTaskListOrderByClause(
    qb: Knex.QueryBuilder,
    sortOrder: ClassificationTaskListSortOrder
  ): Knex.QueryBuilder {
    switch (sortOrder) {
      case ClassificationTaskListSortOrder.ID_ASCENDING:
        return qb.orderBy(ColNameModelServiceClassificationTaskClassificationTaskId, "asc");
      case ClassificationTaskListSortOrder.ID_DESCENDING:
        return qb.orderBy(ColNameModelServiceClassificationTaskClassificationTaskId, "desc");
      case ClassificationTaskListSortOrder.REQUEST_TIME_ASCENDING:
        return qb.orderBy(ColNameModelServiceClassificationTaskRequestTime, "asc");
      case ClassificationTaskListSortOrder.REQUEST_TIME_DESCENDING:
        return qb.orderBy(ColNameModelServiceClassificationTaskRequestTime, "desc");
      default:
        throw new ErrorWithStatus("invalid classification task list sort order", status.INVALID_ARGUMENT)
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
      +row[ColNameModelServiceClassificationTaskOfClassificationTypeId],
      +row[ColNameModelServiceClassificationTaskRequestTime],
      +row[ColNameModelServiceClassificationTaskStatus]
    );
  }
}

injected(ClassificationTaskDataAccessorImpl, KNEX_INSTANCE_TOKEN, LOGGER_TOKEN);

export const CLASSIFICATION_TASK_DATA_ACCESSOR_TOKEN =
  token<ClassificationTaskDataAccessor>("ClassificationTaskDataAccessor");
