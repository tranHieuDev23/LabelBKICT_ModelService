import { Container } from "brandi";
import { getImageServiceDM, IMAGE_SERVICE_DM_TOKEN } from "./image_service";
import {
    ESOPHAGUS_DETECTION_SERVICE_DM_TOKEN,
    getEsophagusDetectionServiceDM,
} from "./esophagus_detection_service";
import {
    getPolypDetectionServiceDM,
    POLYP_DETECTION_SERVICE_DM_TOKEN,
} from "./polyp_detection_service";
import {
    getDirtyDetectionServiceDM,
    DIRTY_DETECTION_SERVICE_DM_TOKEN,
} from "./dirty_detection_service";

export * from "./image_service";
export * from "./polyp_detection_service";
export * from "./esophagus_detection_service";
export * from "./dirty_detection_service"

export function bindToContainer(container: Container): void {
    container
        .bind(IMAGE_SERVICE_DM_TOKEN)
        .toInstance(getImageServiceDM)
        .inSingletonScope();
    container
        .bind(POLYP_DETECTION_SERVICE_DM_TOKEN)
        .toInstance(getPolypDetectionServiceDM)
        .inSingletonScope();
    container
        .bind(ESOPHAGUS_DETECTION_SERVICE_DM_TOKEN)
        .toInstance(getEsophagusDetectionServiceDM)
        .inSingletonScope();
    container
        .bind(DIRTY_DETECTION_SERVICE_DM_TOKEN)
        .toInstance(getDirtyDetectionServiceDM)
        .inSingletonScope();    
}
