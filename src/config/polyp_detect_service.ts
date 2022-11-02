import { token } from "brandi";

export class PolypDetectionServiceConfig {
    public protoPath = "./src/proto/dependencies/detect.proto";
    public host = "127.0.0.1";
    public port = 20000;

    public static fromEnv(): PolypDetectionServiceConfig {
        const config = new PolypDetectionServiceConfig();
        if (process.env.POLYP_DETECTION_SERVICE_PROTO_PATH !== undefined) {
            config.protoPath = process.env.POLYP_DETECTION_SERVICE_PROTO_PATH;
        }
        if (process.env.POLYP_DETECTION_SERVICE_HOST !== undefined) {
            config.host = process.env.POLYP_DETECTION_SERVICE_HOST;
        }
        if (process.env.POLYP_DETECTION_SERVICE_PORT !== undefined) {
            config.port = +process.env.POLYP_DETECTION_SERVICE_PORT;
        }
        return config;
    }
}

export const POLYP_DETECTION_SERVICE_CONFIG_TOKEN =
    token<PolypDetectionServiceConfig>("PolypDetectionServiceConfig");
