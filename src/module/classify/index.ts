import { Container } from "brandi";
import { ClassifyOperatorImpl, CLASSIFY_OPERATOR_TOKEN } from "./classify_operator";
import {
    UpperGastrointestinalClassificationServiceClassifierImpl,
    UPPER_GASTROINTESTINAL_CLASSIFICATION_SERVICE_CLASSIFIER_TOKEN
} from "./upper_gastrointestinal_classification_service_classifier";

export * from "./classify_operator"

export function bindToContainer(container: Container): void {
    container
        .bind(CLASSIFY_OPERATOR_TOKEN)
        .toInstance(ClassifyOperatorImpl)
        .inSingletonScope();
    container
        .bind(UPPER_GASTROINTESTINAL_CLASSIFICATION_SERVICE_CLASSIFIER_TOKEN)
        .toInstance(UpperGastrointestinalClassificationServiceClassifierImpl)
        .inSingletonScope();
}
