import { Container } from "brandi";
import { DetectOperatorImpl, DETECT_OPERATOR_TOKEN } from "./detect_operator";
import {
    PolypDetectionServiceDetectorImpl,
    POLYP_DETECTION_SERVICE_DETECTOR_TOKEN,
} from "./polyp_detection_service_detector";

export * from "./detect_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(DETECT_OPERATOR_TOKEN)
        .toInstance(DetectOperatorImpl)
        .inSingletonScope();
    container
        .bind(POLYP_DETECTION_SERVICE_DETECTOR_TOKEN)
        .toInstance(PolypDetectionServiceDetectorImpl)
        .inSingletonScope();
}
