import { Container } from "brandi";
import {
    UPDATE_PROCESSING_DETECTION_TASK_TO_REQUESTED_TOKEN,
    UpdateProcessingDetectionTaskToRequestedJobImpl,
} from "./update_processing_detection_task_to_requested";
import {
    PROCESS_REQUESTED_DETECTION_TASK_JOB_TOKEN,
    ProcessRequestedDetectionTaskJobImpl,
} from "./process_requested_detection_task";

export * from "./update_processing_detection_task_to_requested";
export * from "./process_requested_detection_task";

export function bindToContainer(container: Container): void {
    container
        .bind(UPDATE_PROCESSING_DETECTION_TASK_TO_REQUESTED_TOKEN)
        .toInstance(UpdateProcessingDetectionTaskToRequestedJobImpl)
        .inSingletonScope();
    container
        .bind(PROCESS_REQUESTED_DETECTION_TASK_JOB_TOKEN)
        .toInstance(ProcessRequestedDetectionTaskJobImpl)
        .inSingletonScope();
}
