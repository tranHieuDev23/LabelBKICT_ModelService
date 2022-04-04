import { injected, token } from "brandi";
import { Logger } from "winston";
import {
    DetectionTaskDataAccessor,
    DETECTION_TASK_DATA_ACCESSOR_TOKEN,
} from "../../dataaccess/db";
import {
    DetectionTaskCreatedProducer,
    DETECTION_TASK_CREATED_PRODUCER_TOKEN,
} from "../../dataaccess/kafka";
import { LOGGER_TOKEN, Timer, TIMER_TOKEN } from "../../utils";

export interface DetectionTaskManagementOperator {
    createDetectionTask(imageId: number): Promise<void>;
}

export class DetectionTaskManagementOperatorImpl
    implements DetectionTaskManagementOperator
{
    constructor(
        private readonly detectionTaskDM: DetectionTaskDataAccessor,
        private readonly detectionTaskCreatedProducer: DetectionTaskCreatedProducer,
        private readonly timer: Timer,
        private readonly logger: Logger
    ) {}

    public async createDetectionTask(imageId: number): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

injected(
    DetectionTaskManagementOperatorImpl,
    DETECTION_TASK_DATA_ACCESSOR_TOKEN,
    DETECTION_TASK_CREATED_PRODUCER_TOKEN,
    TIMER_TOKEN,
    LOGGER_TOKEN
);

export const DETECTION_TASK_MANAGEMENT_OPERATOR_TOKEN =
    token<DetectionTaskManagementOperator>("DetectionTaskManagementOperator");
