import { injected, token } from "brandi";
import { Logger } from "winston";
import { DetectionTaskCreated } from "../dataaccess/kafka";
import { DetectOperator, DETECT_OPERATOR_TOKEN } from "../module/detect";
import { LOGGER_TOKEN } from "../utils";

export interface DetectionTaskCreatedMessageHandler {
    onDetectionTaskCreated(message: DetectionTaskCreated): Promise<void>;
}

export class DetectionTaskCreatedMessageHandlerImpl
    implements DetectionTaskCreatedMessageHandler
{
    constructor(
        private readonly detectOperator: DetectOperator,
        private readonly logger: Logger
    ) {}

    public async onDetectionTaskCreated(
        message: DetectionTaskCreated
    ): Promise<void> {
        this.logger.info(
            "model_service_detection_task_created message received",
            { payload: message }
        );
        await this.detectOperator.processDetectionTask(message.detectionTaskId);
    }
}

injected(
    DetectionTaskCreatedMessageHandlerImpl,
    DETECT_OPERATOR_TOKEN,
    LOGGER_TOKEN
);

export const DETECTION_TASK_CREATED_MESSAGE_HANDLER_TOKEN =
    token<DetectionTaskCreatedMessageHandler>(
        "DetectionTaskCreatedMessageHandler"
    );
