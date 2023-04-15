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

export class ClassificationTaskCreated {
    constructor(public classificationTaskId: number) {}
}

export interface ClassificationTaskCreatedProducer {
    createClassificationTaskCreatedMessage(
        message: ClassificationTaskCreated
    ): Promise<void>;
}

const TopicNameModelServiceClassificationTaskCreated =
    "model_service_classification_task_created";

export class ClassificationTaskCreatedProducerImpl
    implements ClassificationTaskCreatedProducer
{
    constructor(
        private readonly producer: Producer,
        private readonly binaryConverter: BinaryConverter,
        private readonly logger: Logger
    ) {}

    public async createClassificationTaskCreatedMessage(
        message: ClassificationTaskCreated
    ): Promise<void> {
        try {
            await this.producer.connect();
            await this.producer.send({
                topic: TopicNameModelServiceClassificationTaskCreated,
                messages: [{ value: this.binaryConverter.toBuffer(message) }],
            });
        } catch (error) {
            this.logger.error(
                `failed to create ${TopicNameModelServiceClassificationTaskCreated} message`,
                { message, error }
            );
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }
}

injected(
    ClassificationTaskCreatedProducerImpl,
    KAFKA_PRODUCER_TOKEN,
    BINARY_CONVERTER_TOKEN,
    LOGGER_TOKEN
);

export const CLASSIFICATION_TASK_CREATED_PRODUCER_TOKEN =
    token<ClassificationTaskCreatedProducer>("ClassificationTaskCreatedProducer");
