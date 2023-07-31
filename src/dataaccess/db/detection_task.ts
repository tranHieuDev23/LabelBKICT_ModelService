import { injected, token } from "brandi";
import { Knex } from "knex";
import { Logger } from "winston";
import { status } from "@grpc/grpc-js";
import { ErrorWithStatus, LOGGER_TOKEN, TIMER_TOKEN, Timer } from "../../utils";
import { KNEX_INSTANCE_TOKEN } from "./knex";

export enum DetectionTaskStatus {
    REQUESTED = 0,
    DONE = 1,
    PROCESSING = 2,
}

export class DetectionTask {
    constructor(
        public id: number,
        public ofImageId: number,
        public requestTime: number,
        public status: DetectionTaskStatus,
        public updateTime: number
    ) {}
}

export class DetectionTaskListFilterOptions {
    public ofImageIdList: number[] = [];
    public statusList: DetectionTaskStatus[] = [];
}

export enum DetectionTaskListSortOrder {
    ID_ASCENDING = 0,
    ID_DESCENDING = 1,
    REQUEST_TIME_ASCENDING = 2,
    REQUEST_TIME_DESCENDING = 3,
    UPDATE_TIME_ASCENDING = 4,
    UPDATE_TIME_DESCENDING = 5,
}

export interface DetectionTaskDataAccessor {
    createDetectionTask(ofImageId: number, requestTime: number, taskStatus: DetectionTaskStatus): Promise<number>;
    countDetectionTask(filterOptions: DetectionTaskListFilterOptions): Promise<number>;
    getDetectionTaskList(
        offset: number,
        limit: number,
        filterOptions: DetectionTaskListFilterOptions,
        sortOrder: DetectionTaskListSortOrder
    ): Promise<DetectionTask[]>;
    getDetectionTaskWithXLock(id: number): Promise<DetectionTask | null>;
    countRequestedAndProcessingDetectionTaskOfImageId(ofImageId: number): Promise<number>;
    updateDetectionTask(detectionTask: DetectionTask): Promise<void>;
    updateProcessingDetectionTaskWithUpdateTimeBeforeThresholdToRequested(threshold: number): Promise<void>;
    getRequestedDetectionTaskIdListWithUpdateTimeBeforeThreshold(threshold: number): Promise<number[]>;
    withTransaction<T>(executeFunc: (dm: DetectionTaskDataAccessor) => Promise<T>): Promise<T>;
}

const TabNameModelServiceDetectionTask = "model_service_detection_task_tab";
const ColNameModelServiceDetectionTaskDetectionTaskId = "detection_task_id";
const ColNameModelServiceDetectionTaskOfImageId = "of_image_id";
const ColNameModelServiceDetectionTaskRequestTime = "request_time";
const ColNameModelServiceDetectionTaskStatus = "status";
const ColNameModelServiceDetectionTaskUpdateTime = "update_time";

export class DetectionTaskDataAccessorImpl implements DetectionTaskDataAccessor {
    constructor(
        private readonly knex: Knex<any, any[]>,
        private readonly logger: Logger,
        private readonly timer: Timer
    ) {}

    public async createDetectionTask(
        ofImageId: number,
        requestTime: number,
        taskStatus: DetectionTaskStatus
    ): Promise<number> {
        try {
            const rows = await this.knex
                .insert({
                    [ColNameModelServiceDetectionTaskOfImageId]: ofImageId,
                    [ColNameModelServiceDetectionTaskRequestTime]: requestTime,
                    [ColNameModelServiceDetectionTaskStatus]: taskStatus,
                    [ColNameModelServiceDetectionTaskUpdateTime]: this.timer.getCurrentTime(),
                })
                .returning([ColNameModelServiceDetectionTaskDetectionTaskId])
                .into(TabNameModelServiceDetectionTask);
            return +rows[0][ColNameModelServiceDetectionTaskDetectionTaskId];
        } catch (error) {
            this.logger.error("failed to create detection task", { error });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async countDetectionTask(filterOptions: DetectionTaskListFilterOptions): Promise<number> {
        try {
            let queryBuilder = this.knex.count().from(TabNameModelServiceDetectionTask);
            queryBuilder = queryBuilder.where((qb) => {
                return this.getDetectionTaskListFilterOptionsWhereClause(qb, filterOptions);
            });
            const rows = (await queryBuilder) as any[];
            return +rows[0]["count"];
        } catch (error) {
            this.logger.error("failed to get detection task count", { filterOptions, error });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async getDetectionTaskList(
        offset: number,
        limit: number,
        filterOptions: DetectionTaskListFilterOptions,
        sortOrder: DetectionTaskListSortOrder
    ): Promise<DetectionTask[]> {
        try {
            let queryBuilder = this.knex.select().from(TabNameModelServiceDetectionTask).offset(offset).limit(limit);
            queryBuilder = this.applyDetectionTaskListOrderByClause(queryBuilder, sortOrder);
            queryBuilder = queryBuilder.where((qb) => {
                return this.getDetectionTaskListFilterOptionsWhereClause(qb, filterOptions);
            });
            const rows = await queryBuilder;
            return rows.map((row) => this.getDetectionTaskFromRow(row));
        } catch (error) {
            this.logger.error("failed to get detection task list", { offset, limit, filterOptions, sortOrder, error });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    private getDetectionTaskListFilterOptionsWhereClause(
        qb: Knex.QueryBuilder,
        filterOptions: DetectionTaskListFilterOptions
    ): Knex.QueryBuilder {
        qb = qb.whereIn(ColNameModelServiceDetectionTaskOfImageId, filterOptions.ofImageIdList);
        qb = qb.whereIn(ColNameModelServiceDetectionTaskStatus, filterOptions.statusList);
        return qb;
    }

    private applyDetectionTaskListOrderByClause(
        qb: Knex.QueryBuilder,
        sortOption: DetectionTaskListSortOrder
    ): Knex.QueryBuilder {
        switch (sortOption) {
            case DetectionTaskListSortOrder.ID_ASCENDING:
                return qb.orderBy(ColNameModelServiceDetectionTaskDetectionTaskId, "asc");
            case DetectionTaskListSortOrder.ID_DESCENDING:
                return qb.orderBy(ColNameModelServiceDetectionTaskDetectionTaskId, "desc");
            case DetectionTaskListSortOrder.REQUEST_TIME_ASCENDING:
                return qb
                    .orderBy(ColNameModelServiceDetectionTaskRequestTime, "asc")
                    .orderBy(ColNameModelServiceDetectionTaskDetectionTaskId, "asc");
            case DetectionTaskListSortOrder.REQUEST_TIME_DESCENDING:
                return qb
                    .orderBy(ColNameModelServiceDetectionTaskRequestTime, "desc")
                    .orderBy(ColNameModelServiceDetectionTaskDetectionTaskId, "desc");
            case DetectionTaskListSortOrder.UPDATE_TIME_ASCENDING:
                return qb
                    .orderBy(ColNameModelServiceDetectionTaskUpdateTime, "asc")
                    .orderBy(ColNameModelServiceDetectionTaskDetectionTaskId, "asc");
            case DetectionTaskListSortOrder.UPDATE_TIME_DESCENDING:
                return qb
                    .orderBy(ColNameModelServiceDetectionTaskUpdateTime, "desc")
                    .orderBy(ColNameModelServiceDetectionTaskDetectionTaskId, "desc");
            default:
                throw new ErrorWithStatus("invalid detection task list sort order", status.INVALID_ARGUMENT);
        }
    }

    public async getDetectionTaskWithXLock(id: number): Promise<DetectionTask | null> {
        try {
            const rows = await this.knex
                .select()
                .from(TabNameModelServiceDetectionTask)
                .where(ColNameModelServiceDetectionTaskDetectionTaskId, "=", id)
                .forUpdate();
            if (rows.length === 0) {
                this.logger.debug("no detection task with detection_task_id found", { detectionTaskId: id });
                return null;
            }
            if (rows.length > 1) {
                this.logger.debug("more than one detection task with detection_task_id found", { detectionTaskId: id });
                throw new ErrorWithStatus(
                    `more than one detection task with detection_task_id ${id} found`,
                    status.INTERNAL
                );
            }
            return this.getDetectionTaskFromRow(rows[0]);
        } catch (error) {
            this.logger.error("failed to get detection task", { error });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async countRequestedAndProcessingDetectionTaskOfImageId(ofImageId: number): Promise<number> {
        try {
            const rows = await this.knex
                .count()
                .from(TabNameModelServiceDetectionTask)
                .where(ColNameModelServiceDetectionTaskOfImageId, "=", ofImageId)
                .andWhere((qb) => {
                    return qb.whereIn(ColNameModelServiceDetectionTaskStatus, [
                        DetectionTaskStatus.REQUESTED,
                        DetectionTaskStatus.PROCESSING,
                    ]);
                });
            return +(rows[0] as any)["count"];
        } catch (error) {
            this.logger.error("failed to get requested and processing4 detection task count of image_id", {
                ofImageId,
                error,
            });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async updateDetectionTask(detectionTask: DetectionTask): Promise<void> {
        try {
            await this.knex
                .table(TabNameModelServiceDetectionTask)
                .update({
                    [ColNameModelServiceDetectionTaskOfImageId]: detectionTask.ofImageId,
                    [ColNameModelServiceDetectionTaskRequestTime]: detectionTask.requestTime,
                    [ColNameModelServiceDetectionTaskStatus]: detectionTask.status,
                    [ColNameModelServiceDetectionTaskUpdateTime]: this.timer.getCurrentTime(),
                })
                .where(ColNameModelServiceDetectionTaskDetectionTaskId, "=", detectionTask.id)
                .into(TabNameModelServiceDetectionTask);
        } catch (error) {
            this.logger.error("failed to update detection task", {
                detectionTask,
                error,
            });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async updateProcessingDetectionTaskWithUpdateTimeBeforeThresholdToRequested(
        threshold: number
    ): Promise<void> {
        try {
            await this.knex
                .table(TabNameModelServiceDetectionTask)
                .update({
                    [ColNameModelServiceDetectionTaskStatus]: DetectionTaskStatus.REQUESTED,
                    [ColNameModelServiceDetectionTaskUpdateTime]: this.timer.getCurrentTime(),
                })
                .where(ColNameModelServiceDetectionTaskStatus, "=", DetectionTaskStatus.PROCESSING)
                .andWhere(ColNameModelServiceDetectionTaskUpdateTime, "<", threshold)
                .into(TabNameModelServiceDetectionTask);
        } catch (error) {
            this.logger.error(
                "failed to update detection task with updated time before threshold to requested status",
                { threshold, error }
            );
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async getRequestedDetectionTaskIdListWithUpdateTimeBeforeThreshold(threshold: number): Promise<number[]> {
        try {
            const rows = await this.knex
                .select()
                .from(TabNameModelServiceDetectionTask)
                .where(ColNameModelServiceDetectionTaskStatus, "=", DetectionTaskStatus.REQUESTED)
                .andWhere(ColNameModelServiceDetectionTaskUpdateTime, "<", threshold);
            const ids = rows.map((row) => +row[ColNameModelServiceDetectionTaskDetectionTaskId]);
            return ids;
        } catch (error) {
            this.logger.error("failed to get ids of requested detection task with update time before threshold", {
                threshold,
                error,
            });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async withTransaction<T>(executeFunc: (dm: DetectionTaskDataAccessor) => Promise<T>): Promise<T> {
        return this.knex.transaction(async (tx) => {
            const txDataAccessor = new DetectionTaskDataAccessorImpl(tx, this.logger, this.timer);
            return executeFunc(txDataAccessor);
        });
    }

    private getDetectionTaskFromRow(row: Record<string, any>): DetectionTask {
        return new DetectionTask(
            +row[ColNameModelServiceDetectionTaskDetectionTaskId],
            +row[ColNameModelServiceDetectionTaskOfImageId],
            +row[ColNameModelServiceDetectionTaskRequestTime],
            +row[ColNameModelServiceDetectionTaskStatus],
            +row[ColNameModelServiceDetectionTaskUpdateTime]
        );
    }
}

injected(DetectionTaskDataAccessorImpl, KNEX_INSTANCE_TOKEN, LOGGER_TOKEN, TIMER_TOKEN);

export const DETECTION_TASK_DATA_ACCESSOR_TOKEN = token<DetectionTaskDataAccessor>("DetectionTaskDataAccessor");
