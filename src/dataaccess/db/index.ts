import { Container } from "brandi";
import {
    DetectionTaskDataAccessorImpl,
    DETECTION_TASK_DATA_ACCESSOR_TOKEN,
} from "./detection_task";
import { KNEX_INSTANCE_TOKEN, newKnexInstance } from "./knex";

export * from "./detection_task";

export function bindToContainer(container: Container): void {
    container
        .bind(KNEX_INSTANCE_TOKEN)
        .toInstance(newKnexInstance)
        .inSingletonScope();
    container
        .bind(DETECTION_TASK_DATA_ACCESSOR_TOKEN)
        .toInstance(DetectionTaskDataAccessorImpl)
        .inSingletonScope();
}
