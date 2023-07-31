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
import { LOGGER_TOKEN, TIMER_TOKEN, Timer, promisifyGRPCCall } from "../../utils";
import {
    PolypDetectionServiceDetector,
    POLYP_DETECTION_SERVICE_DETECTOR_TOKEN,
} from "./polyp_detection_service_detector";
import { _ImageStatus_Values } from "../../proto/gen/ImageStatus";

export class DetectionTaskNotFound extends Error {
    constructor() {
        super("no detection task with the provided detection_task_id found");
    }
}

export interface DetectOperator {
    processDetectionTask(detectionTaskId: number): Promise<void>;
    processRequestedDetectionTasks(): Promise<void>;
}

export class DetectOperatorImpl implements DetectOperator {
    constructor(
        private readonly detectionTaskDM: DetectionTaskDataAccessor,
        private readonly imageServiceDM: ImageServiceClient,
        private readonly polypDetector: PolypDetectionServiceDetector,
        private readonly timer: Timer,
        private readonly logger: Logger
    ) {}

    public async processDetectionTask(detectionTaskId: number): Promise<void> {
        const detectionTask = await this.detectionTaskDM.getDetectionTaskWithXLock(detectionTaskId);
        if (detectionTask === null) {
            this.logger.error("no detection task with detection_task_id found", { detectionTaskId });
            throw new DetectionTaskNotFound();
        }
        if (detectionTask.status !== DetectionTaskStatus.REQUESTED) {
            this.logger.info("detection task with detection_task_id does not have status of requested", {
                detectionTaskId,
            });
            return;
        }

        detectionTask.status = DetectionTaskStatus.PROCESSING;
        await this.detectionTaskDM.updateDetectionTask(detectionTask);

        const imageId = detectionTask.ofImageId;
        const image = await this.getImage(imageId);
        if (image === null) {
            this.logger.warn("no image with the provided id was found, will skip");
            detectionTask.status = DetectionTaskStatus.DONE;
            await this.detectionTaskDM.updateDetectionTask(detectionTask);
            return;
        }

        if (image.status !== _ImageStatus_Values.UPLOADED) {
            this.logger.info("image is not in uploaded status, will skip", {
                detectionTaskId,
                imageId: image.id,
            });
            return;
        }

        const regionList = await this.polypDetector.detectRegionListFromImage(image);
        await Promise.all(
            regionList.map(async (region) => {
                await this.createRegion(imageId, region);
            })
        );

        detectionTask.status = DetectionTaskStatus.DONE;
        await this.detectionTaskDM.updateDetectionTask(detectionTask);
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

    public async processRequestedDetectionTasks(): Promise<void> {
        const currentTime = this.timer.getCurrentTime();
        const requestedDetectionTaskIdList =
            await this.detectionTaskDM.getRequestedDetectionTaskIdListWithUpdateTimeBeforeThreshold(currentTime);
        this.logger.info("found pending requested detection task", { count: requestedDetectionTaskIdList.length });

        for (const id of requestedDetectionTaskIdList) {
            try {
                this.logger.info("processing requested detection task", { id });
                await this.processDetectionTask(id);
            } catch (error) {
                this.logger.error("failed to process requested detection task", { id, error });
            }
        }
    }
}

injected(
    DetectOperatorImpl,
    DETECTION_TASK_DATA_ACCESSOR_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    POLYP_DETECTION_SERVICE_DETECTOR_TOKEN,
    TIMER_TOKEN,
    LOGGER_TOKEN
);

export const DETECT_OPERATOR_TOKEN = token<DetectOperator>("DetectOperator");
