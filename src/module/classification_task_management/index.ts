import { Container } from "brandi";
import {
    ClassificationTaskManagementOperatorImpl,
    CLASSIFICATION_TASK_MANAGEMENT_OPERATOR_TOKEN,
} from "./classification_task_management_operator";

export * from "./classification_task_management_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(CLASSIFICATION_TASK_MANAGEMENT_OPERATOR_TOKEN)
        .toInstance(ClassificationTaskManagementOperatorImpl)
        .inSingletonScope();
}
