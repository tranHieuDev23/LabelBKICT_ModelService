import { loadPackageDefinition, credentials } from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";
import { injected, token } from "brandi";
import {
    DirtyDetectionServiceConfig,
    DIRTY_DETECTION_SERVICE_CONFIG_TOKEN,
} from "../../config";
import { DirtyDetectionServiceClient } from "../../proto/gen/dirty/proto/DirtyDetectionService";
import { ProtoGrpcType } from "../../proto/gen/dirty_detect";

export function getDirtyDetectionServiceDM(
    dirtyDetectionServiceConfig: DirtyDetectionServiceConfig
): DirtyDetectionServiceClient {
    const DirtyDetectionServiceProtoGrpc = loadDirtyDetectionServiceProtoGrpc(
        dirtyDetectionServiceConfig.protoPath
    );
    return new DirtyDetectionServiceProtoGrpc.dirty.proto.DirtyDetectionService(
        `${dirtyDetectionServiceConfig.host}:${dirtyDetectionServiceConfig.port}`,
        credentials.createInsecure()
    );
}

function loadDirtyDetectionServiceProtoGrpc(protoPath: string): ProtoGrpcType {
    const packageDefinition = loadSync(protoPath, {
        keepCase: false,
        enums: String,
        defaults: false,
        oneofs: true,
    });
    const DirtyDetectionServicePackageDefinition = loadPackageDefinition(
        packageDefinition
    ) as unknown;
    return DirtyDetectionServicePackageDefinition as ProtoGrpcType;
}

injected(getDirtyDetectionServiceDM, DIRTY_DETECTION_SERVICE_CONFIG_TOKEN);

export const DIRTY_DETECTION_SERVICE_DM_TOKEN =
    token<DirtyDetectionServiceClient>("PolypDetectionServiceClient");
