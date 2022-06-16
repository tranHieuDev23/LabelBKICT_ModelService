import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import { Logger } from "winston";
import {
    DetectionTaskDataAccessor,
    DetectionTaskStatus,
    DETECTION_TASK_DATA_ACCESSOR_TOKEN,
} from "../../dataaccess/db";
import {
    DetectionTaskCreated,
    DetectionTaskCreatedProducer,
    DETECTION_TASK_CREATED_PRODUCER_TOKEN,
} from "../../dataaccess/kafka";
import { ErrorWithStatus, LOGGER_TOKEN, Timer, TIMER_TOKEN } from "../../utils";

export interface DetectionTaskManagementOperator {
    createDetectionTask(imageIdList: number[]): Promise<void>;
}

export class DetectionTaskManagementOperatorImpl
    implements DetectionTaskManagementOperator
{
    constructor(
        private readonly detectionTaskDM: DetectionTaskDataAccessor,
        private readonly detectionTaskCreatedProducer: DetectionTaskCreatedProducer,
        private readonly timer: Timer,
        private readonly logger: Logger
    ) {}

    public async createDetectionTask(imageIdList: number[]): Promise<void> {
        const requestTime = this.timer.getCurrentTime();
        for (let imageId of imageIdList) {
            const requestedTaskCount =
                await this.detectionTaskDM.getRequestedDetectionTaskCountOfImageId(
                    imageId
                );
            if (requestedTaskCount > 0) {
                this.logger.error(
                    "there are existing requested detection task for image",
                    { imageId }
                );
                throw new ErrorWithStatus(
                    `there are existing requested detection task for image with image_id ${imageId}`,
                    status.ALREADY_EXISTS
                );
            }
        }
        await this.detectionTaskDM.withTransaction(async (detectionTaskDM) => {
            let taskIdList: number[] = [];
            for (let imageId of imageIdList) {
                const taskID = await detectionTaskDM.createDetectionTask(
                    imageId,
                    requestTime,
                    DetectionTaskStatus.REQUESTED
                );
                taskIdList.push(taskID);
            }
            await this.detectionTaskCreatedProducer.createDetectionTaskCreatedMessage(
                new DetectionTaskCreated(taskIdList)
            );
        });
    }
}

injected(
    DetectionTaskManagementOperatorImpl,
    DETECTION_TASK_DATA_ACCESSOR_TOKEN,
    DETECTION_TASK_CREATED_PRODUCER_TOKEN,
    TIMER_TOKEN,
    LOGGER_TOKEN
);

export const DETECTION_TASK_MANAGEMENT_OPERATOR_TOKEN =
    token<DetectionTaskManagementOperator>("DetectionTaskManagementOperator");
