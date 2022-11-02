import { Container } from "brandi";
import {
    DetectionTaskManagementOperatorImpl,
    DETECTION_TASK_MANAGEMENT_OPERATOR_TOKEN,
} from "./detection_task_management_operator";

export * from "./detection_task_management_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(DETECTION_TASK_MANAGEMENT_OPERATOR_TOKEN)
        .toInstance(DetectionTaskManagementOperatorImpl)
        .inSingletonScope();
}
