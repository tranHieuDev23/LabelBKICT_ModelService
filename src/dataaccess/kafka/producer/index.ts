import { Container } from "brandi";
import {
    DetectionTaskCreatedProducerImpl,
    DETECTION_TASK_CREATED_PRODUCER_TOKEN,
} from "./detection_task_created";
import { getKafkaProducer, KAFKA_PRODUCER_TOKEN } from "./producer";

export * from "./detection_task_created";

export function bindToContainer(container: Container): void {
    container
        .bind(KAFKA_PRODUCER_TOKEN)
        .toInstance(getKafkaProducer)
        .inSingletonScope();
    container
        .bind(DETECTION_TASK_CREATED_PRODUCER_TOKEN)
        .toInstance(DetectionTaskCreatedProducerImpl)
        .inSingletonScope();
}
