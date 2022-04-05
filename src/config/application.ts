import { token } from "brandi";

export class ApplicationConfig {
    public imageTypeIdListForPolypDetectionService: number[] = [];
    public imageTypeIdListForEsophagusDetectionService: number[] = [];

    public static fromEnv(): ApplicationConfig {
        const config = new ApplicationConfig();
        if (process.env.MODEL_SERVICE_IMAGE_TYPE_ID_LIST_FOR_POLYP) {
            config.imageTypeIdListForPolypDetectionService =
                process.env.MODEL_SERVICE_IMAGE_TYPE_ID_LIST_FOR_POLYP.split(
                    ","
                ).map((item) => +item);
        }
        if (process.env.MODEL_SERVICE_IMAGE_TYPE_ID_LIST_FOR_ESOPHAGUS) {
            config.imageTypeIdListForPolypDetectionService =
                process.env.MODEL_SERVICE_IMAGE_TYPE_ID_LIST_FOR_ESOPHAGUS.split(
                    ","
                ).map((item) => +item);
        }
        return config;
    }
}

export const APPLICATION_CONFIG_TOKEN =
    token<ApplicationConfig>("ApplicationConfig");
