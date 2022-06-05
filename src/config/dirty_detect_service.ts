import { token } from "brandi";

export class DirtyDetectionServiceConfig {
    public protoPath = "./src/proto/dependencies/dirty_detect.proto";
    public host = "127.0.0.1";
    public port = 20000;

    public static fromEnv(): DirtyDetectionServiceConfig {
        const config = new DirtyDetectionServiceConfig();
        if (process.env.DIRTY_IMAGE_DETECTION_SERVICE_PATH !== undefined) {
            config.protoPath = process.env.DIRTY_IMAGE_DETECTION_SERVICE_PATH;
        }
        if (process.env.DIRTY_IMAGE_DETECTION_SERVICE_HOST !== undefined) {
            config.host = process.env.DIRTY_IMAGE_DETECTION_SERVICE_HOST;
        }
        if (process.env.DIRTY_IMAGE_DETECTION_SERVICE_PORT !== undefined) {
            config.port = +process.env.DIRTY_IMAGE_DETECTION_SERVICE_PORT;
        }
        return config;
    }
}

export const DIRTY_DETECTION_SERVICE_CONFIG_TOKEN =
    token<DirtyDetectionServiceConfig>("DirtyDetectionServiceConfig");
