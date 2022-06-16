import { injected, token } from "brandi";
import { Logger } from "winston";
import {
    DetectionTaskManagementOperator,
    DETECTION_TASK_MANAGEMENT_OPERATOR_TOKEN,
} from "../module/detection_task_management";
import { Image } from "../proto/gen/Image";
import { LOGGER_TOKEN } from "../utils";

export class ImageCreated {
    constructor(public image: Image) {}
}

export interface ImageCreatedMessageHandler {
    onImageCreated(message: ImageCreated): Promise<void>;
}

export class ImageCreatedMessageHandlerImpl
    implements ImageCreatedMessageHandler
{
    constructor(
        private readonly detectionTaskManagementOperator: DetectionTaskManagementOperator,
        private readonly logger: Logger
    ) {}

    public async onImageCreated(message: ImageCreated): Promise<void> {
        this.logger.info("image_service_image_created message received", {
            payload: message,
        });
        const imageId = message?.image?.id;
        if (imageId === undefined) {
            this.logger.error("image_id is required", { payload: message });
            return;
        }
        const imageIdList: number[] = [imageId];
        await this.detectionTaskManagementOperator.createDetectionTask(imageIdList);
    }
}

injected(
    ImageCreatedMessageHandlerImpl,
    DETECTION_TASK_MANAGEMENT_OPERATOR_TOKEN,
    LOGGER_TOKEN
);

export const IMAGE_CREATED_MESSAGE_HANDLER_TOKEN =
    token<ImageCreatedMessageHandler>("ImageCreatedMessageHandler");
