import { injected, token } from "brandi";
import { Logger } from "winston";
import { MessageConsumer, MESSAGE_CONSUMER_TOKEN } from "../dataaccess/kafka";
import {
    BinaryConverter,
    BINARY_CONVERTER_TOKEN,
    LOGGER_TOKEN,
} from "../utils";
import { 
    ClassificationTaskCreatedMessageHandler,
    CLASSIFICATION_TASK_CREATED_MESSAGE_HANDLER_TOKEN
} from "./classification_task_created";
import {
    DetectionTaskCreatedMessageHandler,
    DETECTION_TASK_CREATED_MESSAGE_HANDLER_TOKEN,
} from "./detection_task_created";
import {
    ImageCreatedMessageHandler,
    IMAGE_CREATED_MESSAGE_HANDLER_TOKEN,
} from "./image_created";

const TopicNameModelServiceDetectionTaskCreated =
    "model_service_detection_task_created";
const TopicNameModelServiceClassificationTaskCreated =
    "model_service_classification_task_created";
const TopicNameImageServiceImageCreated = "image_service_image_created";

export class ModelServiceKafkaConsumer {
    constructor(
        private readonly messageConsumer: MessageConsumer,
        private readonly detectionTaskCreatedMessageHandler: DetectionTaskCreatedMessageHandler,
        private readonly classificationTaskCreatedMessageHandler: ClassificationTaskCreatedMessageHandler,
        private readonly imageCreatedMessageHandler: ImageCreatedMessageHandler,
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
                {
                    topic: TopicNameModelServiceClassificationTaskCreated,
                    onMessage: (message) =>
                        this.onClassificationTaskCreated(message),
                },
                {
                    topic: TopicNameImageServiceImageCreated,
                    onMessage: (message) => this.onImageCreated(message),
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
        const detectionTaskCreatedMessage =
            this.binaryConverter.fromBuffer(message);
        await this.detectionTaskCreatedMessageHandler.onDetectionTaskCreated(
            detectionTaskCreatedMessage
        );
    }

    private async onClassificationTaskCreated(
        message: Buffer | null
    ): Promise<void> {
        if (message === null) {
            this.logger.error("null message, skipping");
            return;
        }
        const classificationTaskCreatedMessage =
            this.binaryConverter.fromBuffer(message);
        await this.classificationTaskCreatedMessageHandler.onClassificationTaskCreated(
            classificationTaskCreatedMessage
        );
    }

    private async onImageCreated(message: Buffer | null): Promise<void> {
        if (message === null) {
            this.logger.error("null message, skipping");
            return;
        }
        const imageCreatedMessage = this.binaryConverter.fromBuffer(message);
        await this.imageCreatedMessageHandler.onImageCreated(
            imageCreatedMessage
        );
    }
}

injected(
    ModelServiceKafkaConsumer,
    MESSAGE_CONSUMER_TOKEN,
    DETECTION_TASK_CREATED_MESSAGE_HANDLER_TOKEN,
    CLASSIFICATION_TASK_CREATED_MESSAGE_HANDLER_TOKEN,
    IMAGE_CREATED_MESSAGE_HANDLER_TOKEN,
    BINARY_CONVERTER_TOKEN,
    LOGGER_TOKEN
);

export const MODEL_SERVICE_KAFKA_CONSUMER_TOKEN =
    token<ModelServiceKafkaConsumer>("ModelServiceKafkaConsumer");
