import { injected, token } from "brandi";
import { Logger } from "winston";
import { ClassificationTaskCreated } from "../dataaccess/kafka";
import { ClassifyOperator, CLASSIFY_OPERATOR_TOKEN } from "../module/classify";
import { LOGGER_TOKEN } from "../utils";

export interface ClassificationTaskCreatedMessageHandler {
    onClassificationTaskCreated(message: ClassificationTaskCreated): Promise<void>;
}

export class ClassificationTaskCreatedMessageHandlerImpl
    implements ClassificationTaskCreatedMessageHandler
{
    constructor(
        private readonly classifyOperator: ClassifyOperator,
        private readonly logger: Logger
    ) {}

    public async onClassificationTaskCreated(
        message: ClassificationTaskCreated
    ): Promise<void> {
        this.logger.info(
            "model_service_classification_task_created message received",
            { payload: message }
        );
        await this.classifyOperator.processClassificationTask(message.classificationTaskId, message.classificationTypeId);
    }
}

injected(
    ClassificationTaskCreatedMessageHandlerImpl,
    CLASSIFY_OPERATOR_TOKEN,
    LOGGER_TOKEN
);

export const CLASSIFICATION_TASK_CREATED_MESSAGE_HANDLER_TOKEN =
    token<ClassificationTaskCreatedMessageHandler>(
        "ClassificationTaskCreatedMessageHandler"
    );
