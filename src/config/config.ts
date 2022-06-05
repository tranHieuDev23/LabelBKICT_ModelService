import { token } from "brandi";
import { ApplicationConfig } from "./application";
import { DatabaseConfig } from "./database";
import { DistributedConfig } from "./distributed";
import { EsophagusDetectionServiceConfig } from "./esophagus_detect_service";
import { GRPCServerConfig } from "./grpc_service";
import { ImageServiceConfig } from "./image_service";
import { KafkaConfig } from "./kafka";
import { LogConfig } from "./log";
import { PolypDetectionServiceConfig } from "./polyp_detect_service";
import { DirtyDetectionServiceConfig } from "./dirty_detect_service"

export class ModelServiceConfig {
    public logConfig = new LogConfig();
    public databaseConfig = new DatabaseConfig();
    public kafkaConfig = new KafkaConfig();
    public imageServiceConfig = new ImageServiceConfig();
    public polypDetectionServiceConfig = new PolypDetectionServiceConfig();
    public esophagusDetectionServiceConfig =
        new EsophagusDetectionServiceConfig();
    public dirtyDetectionServiceConfig = new DirtyDetectionServiceConfig();
    public grpcServerConfig = new GRPCServerConfig();
    public distributedConfig = new DistributedConfig();
    public applicationConfig = new ApplicationConfig();

    public static fromEnv(): ModelServiceConfig {
        const config = new ModelServiceConfig();
        config.logConfig = LogConfig.fromEnv();
        config.databaseConfig = DatabaseConfig.fromEnv();
        config.kafkaConfig = KafkaConfig.fromEnv();
        config.imageServiceConfig = ImageServiceConfig.fromEnv();
        config.polypDetectionServiceConfig =
            PolypDetectionServiceConfig.fromEnv();
        config.esophagusDetectionServiceConfig =
            EsophagusDetectionServiceConfig.fromEnv();
        config.dirtyDetectionServiceConfig =
            DirtyDetectionServiceConfig.fromEnv();
        config.grpcServerConfig = GRPCServerConfig.fromEnv();
        config.distributedConfig = DistributedConfig.fromEnv();
        config.applicationConfig = ApplicationConfig.fromEnv();
        return config;
    }
}

export const MODEL_SERVICE_CONFIG_TOKEN =
    token<ModelServiceConfig>("ModelServiceConfig");
