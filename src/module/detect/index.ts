import { Container } from "brandi";
import { DetectOperatorImpl, DETECT_OPERATOR_TOKEN } from "./detect_operator";

export * from "./detect_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(DETECT_OPERATOR_TOKEN)
        .toInstance(DetectOperatorImpl)
        .inSingletonScope();
}
