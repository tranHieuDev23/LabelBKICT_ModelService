import { injected, token } from "brandi";
import { Logger } from "winston";
import {
    DetectionTaskDataAccessor,
    DETECTION_TASK_DATA_ACCESSOR_TOKEN,
} from "../../dataaccess/db";
import {
    ESOPHAGUS_DETECTION_SERVICE_DM_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    POLYP_DETECTION_SERVICE_DM_TOKEN,
} from "../../dataaccess/grpc";
import { PolypDetectionServiceClient } from "../../proto/gen/com/vdsense/polypnet/proto/PolypDetectionService";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { LOGGER_TOKEN } from "../../utils";

export interface DetectOperator {
    processDetectionTask(detectionTaskId: number): Promise<void>;
}

export class DetectOperatorImpl implements DetectOperator {
    constructor(
        private readonly detectionTaskDM: DetectionTaskDataAccessor,
        private readonly imageServiceDM: ImageServiceClient,
        private readonly polypDetectionServiceDM: PolypDetectionServiceClient,
        private readonly esophagusDetectionServiceDM: PolypDetectionServiceClient,
        private readonly logger: Logger
    ) {}

    public async processDetectionTask(detectionTaskId: number): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

injected(
    DetectOperatorImpl,
    DETECTION_TASK_DATA_ACCESSOR_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    POLYP_DETECTION_SERVICE_DM_TOKEN,
    ESOPHAGUS_DETECTION_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const DETECT_OPERATOR_TOKEN = token<DetectOperator>("DetectOperator");
