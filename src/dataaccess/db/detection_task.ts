import { injected, token } from "brandi";
import { Knex } from "knex";
import { Logger } from "winston";
import { status } from "@grpc/grpc-js";
import { ErrorWithStatus, LOGGER_TOKEN } from "../../utils";
import { KNEX_INSTANCE_TOKEN } from "./knex";

export enum DetectionTaskStatus {
    REQUESTED = 0,
    DONE = 1,
}

export class DetectionTask {
    constructor(
        public id: number,
        public ofImageId: number,
        public requestTime: number,
        public status: DetectionTaskStatus
    ) {}
}

export interface DetectionTaskDataAccessor {
    createDetectionTask(
        ofImageId: number,
        requestTime: number,
        taskStatus: DetectionTaskStatus
    ): Promise<number>;
    getDetectionTaskWithXLock(id: number): Promise<DetectionTask | null>;
    getRequestedDetectionTaskCountOfImageId(ofImageId: number): Promise<number>;
    updateDetectionTask(detectionTask: DetectionTask): Promise<void>;
    withTransaction<T>(
        executeFunc: (dm: DetectionTaskDataAccessor) => Promise<T>
    ): Promise<T>;
}

const TabNameModelServiceDetectionTask = "model_service_detection_task_tab";
const ColNameModelServiceDetectionTaskDetectionTaskId = "detection_task_id";
const ColNameModelServiceDetectionTaskOfImageId = "of_image_id";
const ColNameModelServiceDetectionTaskRequestTime = "request_time";
const ColNameModelServiceDetectionTaskStatus = "status";

export class DetectionTaskDataAccessorImpl
    implements DetectionTaskDataAccessor
{
    constructor(
        private readonly knex: Knex<any, any[]>,
        private readonly logger: Logger
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
                })
                .returning([ColNameModelServiceDetectionTaskDetectionTaskId])
                .into(TabNameModelServiceDetectionTask);
            return +rows[0][ColNameModelServiceDetectionTaskDetectionTaskId];
        } catch (error) {
            this.logger.error("failed to create detection task", { error });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async getDetectionTaskWithXLock(
        id: number
    ): Promise<DetectionTask | null> {
        try {
            const rows = await this.knex
                .select()
                .from(TabNameModelServiceDetectionTask)
                .where(ColNameModelServiceDetectionTaskDetectionTaskId, "=", id)
                .forUpdate();
            if (rows.length === 0) {
                this.logger.debug(
                    "no detection task with detection_task_id found",
                    { detectionTaskId: id }
                );
                return null;
            }
            if (rows.length > 1) {
                this.logger.debug(
                    "more than one detection task with detection_task_id found",
                    { detectionTaskId: id }
                );
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

    public async getRequestedDetectionTaskCountOfImageId(
        ofImageId: number
    ): Promise<number> {
        try {
            const rows = await this.knex
                .count()
                .from(TabNameModelServiceDetectionTask)
                .where(
                    ColNameModelServiceDetectionTaskOfImageId,
                    "=",
                    ofImageId
                )
                .andWhere(
                    ColNameModelServiceDetectionTaskStatus,
                    "=",
                    DetectionTaskStatus.REQUESTED
                )
                .forUpdate();
            return +(rows[0] as any)["count"];
        } catch (error) {
            this.logger.error(
                "failed to get detection task count of image_id",
                { ofImageId, error }
            );
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async updateDetectionTask(
        detectionTask: DetectionTask
    ): Promise<void> {
        try {
            await this.knex
                .table(TabNameModelServiceDetectionTask)
                .update({
                    [ColNameModelServiceDetectionTaskOfImageId]:
                        detectionTask.ofImageId,
                    [ColNameModelServiceDetectionTaskRequestTime]:
                        detectionTask.requestTime,
                    [ColNameModelServiceDetectionTaskStatus]:
                        detectionTask.status,
                })
                .where(
                    ColNameModelServiceDetectionTaskDetectionTaskId,
                    "=",
                    detectionTask.id
                )
                .into(TabNameModelServiceDetectionTask);
        } catch (error) {
            this.logger.error("failed to update detection task", {
                detectionTask,
                error,
            });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async withTransaction<T>(
        executeFunc: (dm: DetectionTaskDataAccessor) => Promise<T>
    ): Promise<T> {
        return this.knex.transaction(async (tx) => {
            const txDataAccessor = new DetectionTaskDataAccessorImpl(
                tx,
                this.logger
            );
            return executeFunc(txDataAccessor);
        });
    }

    private getDetectionTaskFromRow(row: Record<string, any>): DetectionTask {
        return new DetectionTask(
            +row[ColNameModelServiceDetectionTaskDetectionTaskId],
            +row[ColNameModelServiceDetectionTaskOfImageId],
            +row[ColNameModelServiceDetectionTaskRequestTime],
            +row[ColNameModelServiceDetectionTaskStatus]
        );
    }
}

injected(DetectionTaskDataAccessorImpl, KNEX_INSTANCE_TOKEN, LOGGER_TOKEN);

export const DETECTION_TASK_DATA_ACCESSOR_TOKEN =
    token<DetectionTaskDataAccessor>("DetectionTaskDataAccessor");
