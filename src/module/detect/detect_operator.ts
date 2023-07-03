import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import { Logger } from "winston";
import {
    DetectionTaskDataAccessor,
    DetectionTaskStatus,
    DETECTION_TASK_DATA_ACCESSOR_TOKEN,
} from "../../dataaccess/db";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { Image } from "../../proto/gen/Image";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { Polygon } from "../../proto/gen/Polygon";
import { LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";
import {
    PolypDetectionServiceDetector,
    POLYP_DETECTION_SERVICE_DETECTOR_TOKEN,
} from "./polyp_detection_service_detector";

export class DetectionTaskNotFound extends Error {
    constructor() {
        super("no detection task with the provided detection_task_id found");
    }
}

export interface DetectOperator {
    processDetectionTask(detectionTaskId: number): Promise<void>;
}

export class DetectOperatorImpl implements DetectOperator {
    constructor(
        private readonly detectionTaskDM: DetectionTaskDataAccessor,
        private readonly imageServiceDM: ImageServiceClient,
        private readonly polypDetector: PolypDetectionServiceDetector,
        private readonly logger: Logger
    ) {}

    public async processDetectionTask(detectionTaskId: number): Promise<void> {
        await this.detectionTaskDM.withTransaction(async (detectionTaskDM) => {
            const detectionTask = await detectionTaskDM.getDetectionTaskWithXLock(detectionTaskId);
            if (detectionTask === null) {
                this.logger.error("no detection task with detection_task_id found", { detectionTaskId });
                throw new DetectionTaskNotFound();
            }
            if (detectionTask.status === DetectionTaskStatus.DONE) {
                this.logger.info("detection task with detection_task_id already has status of done", {
                    detectionTaskId,
                });
                return;
            }

            const imageId = detectionTask.ofImageId;
            const image = await this.getImage(imageId);
            if (image === null) {
                this.logger.warn("no image with the provided id was found, will skip");
                detectionTask.status = DetectionTaskStatus.DONE;
                await detectionTaskDM.updateDetectionTask(detectionTask);
                return;
            }

            const regionList = await this.polypDetector.detectRegionListFromImage(image);
            await Promise.all(
                regionList.map(async (region) => {
                    await this.createRegion(imageId, region);
                })
            );

            detectionTask.status = DetectionTaskStatus.DONE;
            await detectionTaskDM.updateDetectionTask(detectionTask);
        });
    }

    private async getImage(imageId: number): Promise<Image | null> {
        const { error: getImageError, response: getImageResponse } = await promisifyGRPCCall(
            this.imageServiceDM.getImage.bind(this.imageServiceDM),
            { id: imageId }
        );
        if (getImageError !== null) {
            if (getImageError.code === status.NOT_FOUND) {
                this.logger.warn("called image_service.getImage(), but no image was found", { error: getImageError });
                return null;
            }

            this.logger.error("failed to call image_service.getImage()", {
                error: getImageError,
            });
            throw getImageError;
        }
        if (getImageResponse?.image === undefined) {
            this.logger.error("invalid response from image_service.getImage()");
            throw new Error("invalid response from image_service.getImage()");
        }
        return getImageResponse.image;
    }

    private async createRegion(imageId: number, border: Polygon): Promise<void> {
        const { error: createRegionError } = await promisifyGRPCCall(
            this.imageServiceDM.createRegion.bind(this.imageServiceDM),
            {
                ofImageId: imageId,
                drawnByUserId: 0,
                border: border,
                holes: [],
                labeledByUserId: 0,
            }
        );

        if (createRegionError !== null) {
            this.logger.error("failed to call image_service.createRegion()", {
                error: createRegionError,
            });
            throw createRegionError;
        }
    }
}

injected(
    DetectOperatorImpl,
    DETECTION_TASK_DATA_ACCESSOR_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    POLYP_DETECTION_SERVICE_DETECTOR_TOKEN,
    LOGGER_TOKEN
);

export const DETECT_OPERATOR_TOKEN = token<DetectOperator>("DetectOperator");
