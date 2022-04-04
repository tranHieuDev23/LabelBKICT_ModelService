import {
    loadPackageDefinition,
    Server,
    ServerCredentials,
} from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";
import { injected, token } from "brandi";
import {
    ModelServiceHandlersFactory,
    MODEL_SERVICE_HANDLERS_FACTORY_TOKEN,
} from "./handler";
import { GRPCServerConfig, GRPC_SERVER_CONFIG } from "../config";
import { ProtoGrpcType } from "../proto/gen/model_service";
import { Logger } from "winston";
import { LOGGER_TOKEN } from "../utils";

export class ModelServiceGRPCServer {
    constructor(
        private readonly handlerFactory: ModelServiceHandlersFactory,
        private readonly grpcServerConfig: GRPCServerConfig,
        private readonly logger: Logger
    ) {}

    public loadProtoAndStart(protoPath: string): void {
        const modelServiceProtoGrpc = this.loadModelServiceProtoGrpc(protoPath);

        const server = new Server();
        server.addService(
            modelServiceProtoGrpc.ModelService.service,
            this.handlerFactory.getModelServiceHandlers()
        );

        server.bindAsync(
            `127.0.0.1:${this.grpcServerConfig.port}`,
            ServerCredentials.createInsecure(),
            (error, port) => {
                if (error) {
                    this.logger.error("failed to start grpc server", { error });
                    return;
                }

                console.log(`starting grpc server, listening to port ${port}`);
                this.logger.info("starting grpc server", { port });
                server.start();
            }
        );
    }

    private loadModelServiceProtoGrpc(protoPath: string): ProtoGrpcType {
        const packageDefinition = loadSync(protoPath, {
            keepCase: false,
            enums: Number,
            defaults: false,
            oneofs: true,
        });
        const modelServicePackageDefinition = loadPackageDefinition(
            packageDefinition
        ) as unknown;
        return modelServicePackageDefinition as ProtoGrpcType;
    }
}

injected(
    ModelServiceGRPCServer,
    MODEL_SERVICE_HANDLERS_FACTORY_TOKEN,
    GRPC_SERVER_CONFIG,
    LOGGER_TOKEN
);

export const MODEL_SERVICE_GRPC_SERVER_TOKEN = token<ModelServiceGRPCServer>(
    "ModelServiceGRPCServer"
);
