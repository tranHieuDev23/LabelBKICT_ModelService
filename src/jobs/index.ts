import { Container } from "brandi";
import {
    UPDATE_PROCESSING_DETECTION_TASK_TO_REQUESTED_TOKEN,
    UpdateProcessingDetectionTaskToRequestedJobImpl,
} from "./update_processing_detection_task_to_requested";

export * from "./update_processing_detection_task_to_requested";

export function bindToContainer(container: Container): void {
    container
        .bind(UPDATE_PROCESSING_DETECTION_TASK_TO_REQUESTED_TOKEN)
        .toInstance(UpdateProcessingDetectionTaskToRequestedJobImpl)
        .inSingletonScope();
}
