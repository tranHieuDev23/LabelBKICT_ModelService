import { loadPackageDefinition, credentials } from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";
import { injected, token } from "brandi";
import {
    PolypDetectionServiceConfig,
    POLYP_DETECTION_SERVICE_CONFIG_TOKEN,
} from "../../config";
import { PolypDetectionServiceClient } from "../../proto/gen/com/vdsense/polypnet/proto/PolypDetectionService";
import { ProtoGrpcType } from "../../proto/gen/detect";

export function getPolypDetectionServiceDM(
    polypDetectionServiceConfig: PolypDetectionServiceConfig
): PolypDetectionServiceClient {
    const PolypDetectionServiceProtoGrpc = loadPolypDetectionServiceProtoGrpc(
        polypDetectionServiceConfig.protoPath
    );
    return new PolypDetectionServiceProtoGrpc.com.vdsense.polypnet.proto.PolypDetectionService(
        `${polypDetectionServiceConfig.host}:${polypDetectionServiceConfig.port}`,
        credentials.createInsecure()
    );
}

function loadPolypDetectionServiceProtoGrpc(protoPath: string): ProtoGrpcType {
    const packageDefinition = loadSync(protoPath, {
        keepCase: false,
        enums: String,
        defaults: false,
        oneofs: true,
    });
    const PolypDetectionServicePackageDefinition = loadPackageDefinition(
        packageDefinition
    ) as unknown;
    return PolypDetectionServicePackageDefinition as ProtoGrpcType;
}

injected(getPolypDetectionServiceDM, POLYP_DETECTION_SERVICE_CONFIG_TOKEN);

export const POLYP_DETECTION_SERVICE_DM_TOKEN =
    token<PolypDetectionServiceClient>("PolypDetectionServiceClient");
