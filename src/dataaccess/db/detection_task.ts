import { injected, token } from "brandi";
import { Knex } from "knex";
import { Logger } from "winston";
import { LOGGER_TOKEN } from "../../utils";
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
        status: DetectionTaskStatus
    ): Promise<number>;
    getDetectionTaskWithXLock(id: number): Promise<DetectionTask>;
    getRequestedDetectionTaskCountOfImageId(ofImageId: number): Promise<number>;
    updateDetectionTask(detectionTask: DetectionTask): Promise<void>;
    withTransaction<T>(
        executeFunc: (dm: DetectionTaskDataAccessor) => Promise<T>
    ): Promise<T>;
}

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
        status: DetectionTaskStatus
    ): Promise<number> {
        throw new Error("Method not implemented.");
    }

    public async getDetectionTaskWithXLock(id: number): Promise<DetectionTask> {
        throw new Error("Method not implemented.");
    }

    public async getRequestedDetectionTaskCountOfImageId(
        ofImageId: number
    ): Promise<number> {
        throw new Error("Method not implemented.");
    }

    public async updateDetectionTask(
        detectionTask: DetectionTask
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async withTransaction<T>(
        executeFunc: (dm: DetectionTaskDataAccessor) => Promise<T>
    ): Promise<T> {
        throw new Error("Method not implemented.");
    }
}

injected(DetectionTaskDataAccessorImpl, KNEX_INSTANCE_TOKEN, LOGGER_TOKEN);

export const DETECTION_TASK_DATA_ACCESSOR_TOKEN =
    token<DetectionTaskDataAccessor>("DetectionTaskDataAccessor");
