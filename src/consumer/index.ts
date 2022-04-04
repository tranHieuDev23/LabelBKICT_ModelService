import { Container } from "brandi";
import {
    ModelServiceKafkaConsumer,
    MODEL_SERVICE_KAFKA_CONSUMER_TOKEN,
} from "./consumer";
import {
    DetectionTaskCreatedMessageHandlerImpl,
    DETECTION_TASK_CREATED_MESSAGE_HANDLER_TOKEN,
} from "./detection_task_created";

export * from "./consumer";

export function bindToContainer(container: Container): void {
    container
        .bind(DETECTION_TASK_CREATED_MESSAGE_HANDLER_TOKEN)
        .toInstance(DetectionTaskCreatedMessageHandlerImpl)
        .inSingletonScope();
    container
        .bind(MODEL_SERVICE_KAFKA_CONSUMER_TOKEN)
        .toInstance(ModelServiceKafkaConsumer)
        .inSingletonScope();
}
