import { Container } from "brandi";
import { APPLICATION_CONFIG_TOKEN } from "./application";
import { ModelServiceConfig, MODEL_SERVICE_CONFIG_TOKEN } from "./config";
import { DATABASE_CONFIG_TOKEN } from "./database";
import { DISTRIBUTED_CONFIG_TOKEN } from "./distributed";
import { ESOPHAGUS_DETECTION_SERVICE_CONFIG_TOKEN } from "./esophagus_detect_service";
import { GRPC_SERVER_CONFIG } from "./grpc_service";
import { IMAGE_SERVICE_CONFIG_TOKEN } from "./image_service";
import { KAFKA_CONFIG_TOKEN } from "./kafka";
import { LOG_CONFIG_TOKEN } from "./log";
import { POLYP_DETECTION_SERVICE_CONFIG_TOKEN } from "./polyp_detect_service";
import { DIRTY_DETECTION_SERVICE_CONFIG_TOKEN } from "./dirty_detect_service";

export * from "./log";
export * from "./database";
export * from "./kafka";
export * from "./image_service";
export * from "./polyp_detect_service";
export * from "./esophagus_detect_service";
export * from "./grpc_service";
export * from "./application";
export * from "./distributed";
export * from "./config";
export * from "./dirty_detect_service"

export function bindToContainer(container: Container): void {
    container
        .bind(MODEL_SERVICE_CONFIG_TOKEN)
        .toInstance(ModelServiceConfig.fromEnv)
        .inSingletonScope();
    container
        .bind(LOG_CONFIG_TOKEN)
        .toInstance(() => container.get(MODEL_SERVICE_CONFIG_TOKEN).logConfig)
        .inSingletonScope();
    container
        .bind(DATABASE_CONFIG_TOKEN)
        .toInstance(
            () => container.get(MODEL_SERVICE_CONFIG_TOKEN).databaseConfig
        )
        .inSingletonScope();
    container
        .bind(KAFKA_CONFIG_TOKEN)
        .toInstance(() => container.get(MODEL_SERVICE_CONFIG_TOKEN).kafkaConfig)
        .inSingletonScope();
    container
        .bind(IMAGE_SERVICE_CONFIG_TOKEN)
        .toInstance(
            () => container.get(MODEL_SERVICE_CONFIG_TOKEN).imageServiceConfig
        )
        .inSingletonScope();
    container
        .bind(POLYP_DETECTION_SERVICE_CONFIG_TOKEN)
        .toInstance(
            () =>
                container.get(MODEL_SERVICE_CONFIG_TOKEN)
                    .polypDetectionServiceConfig
        )
        .inSingletonScope();
    container
        .bind(ESOPHAGUS_DETECTION_SERVICE_CONFIG_TOKEN)
        .toInstance(
            () =>
                container.get(MODEL_SERVICE_CONFIG_TOKEN)
                    .esophagusDetectionServiceConfig
        )
        .inSingletonScope();
    container
        .bind(DIRTY_DETECTION_SERVICE_CONFIG_TOKEN)
        .toInstance(
            () =>
                container.get(MODEL_SERVICE_CONFIG_TOKEN)
                    .dirtyDetectionServiceConfig
        )
        .inSingletonScope();
    container
        .bind(GRPC_SERVER_CONFIG)
        .toInstance(
            () => container.get(MODEL_SERVICE_CONFIG_TOKEN).grpcServerConfig
        )
        .inSingletonScope();
    container
        .bind(DISTRIBUTED_CONFIG_TOKEN)
        .toInstance(
            () => container.get(MODEL_SERVICE_CONFIG_TOKEN).distributedConfig
        )
        .inSingletonScope();
    container
        .bind(APPLICATION_CONFIG_TOKEN)
        .toInstance(
            () => container.get(MODEL_SERVICE_CONFIG_TOKEN).applicationConfig
        )
        .inSingletonScope();
}
