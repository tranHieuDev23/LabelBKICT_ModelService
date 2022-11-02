import { token } from "brandi";

export class EsophagusDetectionServiceConfig {
    public protoPath = "./src/proto/dependencies/detect.proto";
    public host = "127.0.0.1";
    public port = 20000;

    public static fromEnv(): EsophagusDetectionServiceConfig {
        const config = new EsophagusDetectionServiceConfig();
        if (process.env.ESOPHAGUS_DETECTION_SERVICE_PROTO_PATH !== undefined) {
            config.protoPath =
                process.env.ESOPHAGUS_DETECTION_SERVICE_PROTO_PATH;
        }
        if (process.env.ESOPHAGUS_DETECTION_SERVICE_HOST !== undefined) {
            config.host = process.env.ESOPHAGUS_DETECTION_SERVICE_HOST;
        }
        if (process.env.ESOPHAGUS_DETECTION_SERVICE_PORT !== undefined) {
            config.port = +process.env.ESOPHAGUS_DETECTION_SERVICE_PORT;
        }
        return config;
    }
}

export const ESOPHAGUS_DETECTION_SERVICE_CONFIG_TOKEN =
    token<EsophagusDetectionServiceConfig>("EsophagusDetectionServiceConfig");
