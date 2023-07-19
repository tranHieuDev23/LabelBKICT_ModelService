import { token } from "brandi";

export class ApplicationConfig {
    public imageTypeIdListForPolypDetectionService: number[] = [];
    public imageTypeIdListForEsophagusDetectionService: number[] = [];
    public detectionTaskProcessingTimeThresholdInMillisecond: number = 1000 * 60 * 15;

    public static fromEnv(): ApplicationConfig {
        const config = new ApplicationConfig();
        if (process.env.MODEL_SERVICE_IMAGE_TYPE_ID_LIST_FOR_POLYP) {
            config.imageTypeIdListForPolypDetectionService =
                process.env.MODEL_SERVICE_IMAGE_TYPE_ID_LIST_FOR_POLYP.split(",").map((item) => +item);
        }
        if (process.env.MODEL_SERVICE_IMAGE_TYPE_ID_LIST_FOR_ESOPHAGUS) {
            config.imageTypeIdListForEsophagusDetectionService =
                process.env.MODEL_SERVICE_IMAGE_TYPE_ID_LIST_FOR_ESOPHAGUS.split(",").map((item) => +item);
        }
        if (process.env.MODEL_SERVICE_DETECTION_TASK_PROCESSING_TIME_THRESHOLD_IN_MILLISECOND) {
            config.detectionTaskProcessingTimeThresholdInMillisecond =
                +process.env.MODEL_SERVICE_DETECTION_TASK_PROCESSING_TIME_THRESHOLD_IN_MILLISECOND;
        }
        return config;
    }
}

export const APPLICATION_CONFIG_TOKEN = token<ApplicationConfig>("ApplicationConfig");
