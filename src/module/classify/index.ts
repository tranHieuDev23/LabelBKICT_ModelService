import { Container } from "brandi";
import { ClassifyOperatorImpl, CLASSIFY_OPERATOR_TOKEN } from "./classify_operator";
import {
    GastricClassificationServiceClassifierImpl,
    GASTRIC_CLASSIFICATION_SERVICE_CLASSIFIER_TOKEN
} from "./gastric_classification_service_classifier";

export * from "./classify_operator"

export function bindToContainer(container: Container): void {
    container
        .bind(CLASSIFY_OPERATOR_TOKEN)
        .toInstance(ClassifyOperatorImpl)
        .inSingletonScope();
    container
        .bind(GASTRIC_CLASSIFICATION_SERVICE_CLASSIFIER_TOKEN)
        .toInstance(GastricClassificationServiceClassifierImpl)
        .inSingletonScope();
}
