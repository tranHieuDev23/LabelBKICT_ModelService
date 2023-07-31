import { Container } from "brandi";
import {
    DetectionTaskDataAccessorImpl,
    DETECTION_TASK_DATA_ACCESSOR_TOKEN,
} from "./detection_task";
import {
    ClassificationResultDataAccessorImpl,
    CLASSIFICATION_RESULT_DATA_ACCESSOR_TOKEN
} from "./classification_result";
import { KNEX_INSTANCE_TOKEN, newKnexInstance } from "./knex";
import { 
    ClassificationTaskDataAccessorImpl,
    CLASSIFICATION_TASK_DATA_ACCESSOR_TOKEN 
} from "./classification_task";
import {
    ClassificationTypeDataAccessorImpl,
    CLASSIFICATION_TYPE_DATA_ACCESSOR_TOKEN
} from "./classification_type";

export * from "./detection_task";
export * from "./classification_task";
export * from "./classification_result"
export * from "./classification_type";

export function bindToContainer(container: Container): void {
    container
        .bind(KNEX_INSTANCE_TOKEN)
        .toInstance(newKnexInstance)
        .inSingletonScope();
    container
        .bind(DETECTION_TASK_DATA_ACCESSOR_TOKEN)
        .toInstance(DetectionTaskDataAccessorImpl)
        .inSingletonScope();
    container
        .bind(CLASSIFICATION_TASK_DATA_ACCESSOR_TOKEN)
        .toInstance(ClassificationTaskDataAccessorImpl)
        .inSingletonScope();
    container
        .bind(CLASSIFICATION_RESULT_DATA_ACCESSOR_TOKEN)
        .toInstance(ClassificationResultDataAccessorImpl)
        .inSingletonScope();
    container
        .bind(CLASSIFICATION_TYPE_DATA_ACCESSOR_TOKEN)
        .toInstance(ClassificationTypeDataAccessorImpl)
        .inSingletonScope();
}
