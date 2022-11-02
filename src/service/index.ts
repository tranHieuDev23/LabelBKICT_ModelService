import { Container } from "brandi";
import {
    ModelServiceHandlersFactory,
    MODEL_SERVICE_HANDLERS_FACTORY_TOKEN,
} from "./handler";
import {
    ModelServiceGRPCServer,
    MODEL_SERVICE_GRPC_SERVER_TOKEN,
} from "./server";

export * from "./handler";
export * from "./server";

export function bindToContainer(container: Container): void {
    container
        .bind(MODEL_SERVICE_HANDLERS_FACTORY_TOKEN)
        .toInstance(ModelServiceHandlersFactory)
        .inSingletonScope();
    container
        .bind(MODEL_SERVICE_GRPC_SERVER_TOKEN)
        .toInstance(ModelServiceGRPCServer)
        .inSingletonScope();
}
