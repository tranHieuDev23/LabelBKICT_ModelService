import { injected, token } from "brandi";
import { Logger } from "winston";
import { MessageConsumer, MESSAGE_CONSUMER_TOKEN } from "../dataaccess/kafka";
import {
    BinaryConverter,
    BINARY_CONVERTER_TOKEN,
    LOGGER_TOKEN,
} from "../utils";
import {
    DetectionTaskCreatedMessageHandler,
    DETECTION_TASK_CREATED_MESSAGE_HANDLER_TOKEN,
} from "./detection_task_created";

const TopicNameModelServiceDetectionTaskCreated =
    "model_service_detection_task_created";

export class ModelServiceKafkaConsumer {
    constructor(
        private readonly messageConsumer: MessageConsumer,
        private readonly detectionTaskCreatedMessageHandler: DetectionTaskCreatedMessageHandler,
        private readonly binaryConverter: BinaryConverter,
        private readonly logger: Logger
    ) {}

    public start(): void {
        this.messageConsumer
            .registerHandlerListAndStart([
                {
                    topic: TopicNameModelServiceDetectionTaskCreated,
                    onMessage: (message) =>
                        this.onDetectionTaskCreated(message),
                },
            ])
            .then(() => {
                if (process.send) {
                    process.send("ready");
                }
            });
    }

    private async onDetectionTaskCreated(
        message: Buffer | null
    ): Promise<void> {
        if (message === null) {
            this.logger.error("null message, skipping");
            return;
        }
        const exportCreatedMessage = this.binaryConverter.fromBuffer(message);
        await this.detectionTaskCreatedMessageHandler.onDetectionTaskCreated(
            exportCreatedMessage
        );
    }
}

injected(
    ModelServiceKafkaConsumer,
    MESSAGE_CONSUMER_TOKEN,
    DETECTION_TASK_CREATED_MESSAGE_HANDLER_TOKEN,
    BINARY_CONVERTER_TOKEN,
    LOGGER_TOKEN
);

export const MODEL_SERVICE_KAFKA_CONSUMER_TOKEN =
    token<ModelServiceKafkaConsumer>("ModelServiceKafkaConsumer");
