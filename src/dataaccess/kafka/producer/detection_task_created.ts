import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import { Producer } from "kafkajs";
import { Logger } from "winston";
import {
    BinaryConverter,
    BINARY_CONVERTER_TOKEN,
    ErrorWithStatus,
    LOGGER_TOKEN,
} from "../../../utils";
import { KAFKA_PRODUCER_TOKEN } from "./producer";

export class DetectionTaskCreated {
    constructor(public detectionTaskId: number) {}
}

export interface DetectionTaskCreatedProducer {
    createDetectionTaskCreatedMessage(
        message: DetectionTaskCreated
    ): Promise<void>;
}

const TopicNameModelServiceDetectionTaskCreated =
    "model_service_detection_task_created";

export class DetectionTaskCreatedProducerImpl
    implements DetectionTaskCreatedProducer
{
    constructor(
        private readonly producer: Producer,
        private readonly binaryConverter: BinaryConverter,
        private readonly logger: Logger
    ) {}

    public async createDetectionTaskCreatedMessage(
        message: DetectionTaskCreated
    ): Promise<void> {
        try {
            await this.producer.connect();
            await this.producer.send({
                topic: TopicNameModelServiceDetectionTaskCreated,
                messages: [{ value: this.binaryConverter.toBuffer(message) }],
            });
        } catch (error) {
            this.logger.error(
                `failed to create ${TopicNameModelServiceDetectionTaskCreated} message`,
                { message, error }
            );
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }
}

injected(
    DetectionTaskCreatedProducerImpl,
    KAFKA_PRODUCER_TOKEN,
    BINARY_CONVERTER_TOKEN,
    LOGGER_TOKEN
);

export const DETECTION_TASK_CREATED_PRODUCER_TOKEN =
    token<DetectionTaskCreatedProducer>("DetectionTaskCreatedProducer");
