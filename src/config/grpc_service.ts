import { token } from "brandi";

export class GRPCServerConfig {
    public port = 20003;

    public static fromEnv(): GRPCServerConfig {
        const config = new GRPCServerConfig();
        if (process.env.MODEL_SERVICE_PORT !== undefined) {
            config.port = +process.env.MODEL_SERVICE_PORT;
        }
        return config;
    }
}

export const GRPC_SERVER_CONFIG = token<GRPCServerConfig>("GRPCServerConfig");
