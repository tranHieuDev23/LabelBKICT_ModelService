import { injected, token } from "brandi";
import { Logger } from "winston";
import {
    DetectionTaskDataAccessor,
    DetectionTask as DMDetectionTask,
    DetectionTaskStatus as DMDetectionTaskStatus,
    DetectionTaskListSortOrder as DMDetectionTaskListSortOrder,
    DETECTION_TASK_DATA_ACCESSOR_TOKEN,
    DetectionTaskListFilterOptions,
} from "../../dataaccess/db";
import {
    DetectionTaskCreated,
    DetectionTaskCreatedProducer,
    DETECTION_TASK_CREATED_PRODUCER_TOKEN,
} from "../../dataaccess/kafka";
import { ErrorWithStatus, LOGGER_TOKEN, Timer, TIMER_TOKEN } from "../../utils";
import { _DetectionTaskStatus_Values } from "../../proto/gen/DetectionTaskStatus";
import { DetectionTask } from "../../proto/gen/DetectionTask";
import { status } from "@grpc/grpc-js";
import { _DetectionTaskListSortOrder_Values } from "../../proto/gen/DetectionTaskListSortOrder";
import { APPLICATION_CONFIG_TOKEN, ApplicationConfig } from "../../config";

export interface DetectionTaskManagementOperator {
    createDetectionTask(imageId: number): Promise<void>;
    createDetectionTaskBatch(imageIdList: number[]): Promise<void>;
    getDetectionTaskList(
        offset: number,
        limit: number,
        ofImageIdList: number[],
        statusList: _DetectionTaskStatus_Values[],
        sortOrder: _DetectionTaskListSortOrder_Values
    ): Promise<{
        totalDetectionTaskCount: number;
        detectionTaskList: DetectionTask[];
    }>;
    updateProcessingDetectionTaskWithUpdateTimeBeforeThresholdToRequested(): Promise<void>;
}

export class DetectionTaskManagementOperatorImpl implements DetectionTaskManagementOperator {
    constructor(
        private readonly detectionTaskDM: DetectionTaskDataAccessor,
        private readonly detectionTaskCreatedProducer: DetectionTaskCreatedProducer,
        private readonly timer: Timer,
        private readonly logger: Logger,
        private readonly applicationConfig: ApplicationConfig
    ) {}

    public async createDetectionTask(imageId: number): Promise<void> {
        const requestTime = this.timer.getCurrentTime();
        const requestedAndProcessingTaskCount =
            await this.detectionTaskDM.countRequestedAndProcessingDetectionTaskOfImageId(imageId);
        if (requestedAndProcessingTaskCount > 0) {
            this.logger.error("there are existing requested/processing detection tasks for image", { imageId });
            return;
        }
        const taskID = await this.detectionTaskDM.createDetectionTask(
            imageId,
            requestTime,
            DMDetectionTaskStatus.REQUESTED
        );
        await this.detectionTaskCreatedProducer.createDetectionTaskCreatedMessage(new DetectionTaskCreated(taskID));
    }

    public async createDetectionTaskBatch(imageIdList: number[]): Promise<void> {
        await Promise.all(imageIdList.map((imageId) => this.createDetectionTask(imageId)));
    }

    public async getDetectionTaskList(
        offset: number,
        limit: number,
        ofImageIdList: number[],
        statusList: _DetectionTaskStatus_Values[],
        sortOrder: _DetectionTaskListSortOrder_Values
    ): Promise<{ totalDetectionTaskCount: number; detectionTaskList: DetectionTask[] }> {
        const filterOptions = new DetectionTaskListFilterOptions();
        filterOptions.ofImageIdList = ofImageIdList;
        filterOptions.statusList = statusList.map((item) => this.getDMDetectionTaskStatus(item));
        const [totalDetectionTaskCount, dmDetectionTaskList] = await Promise.all([
            this.detectionTaskDM.countDetectionTask(filterOptions),
            this.detectionTaskDM.getDetectionTaskList(
                offset,
                limit,
                filterOptions,
                this.getDMDetectionTaskListSortOrder(sortOrder)
            ),
        ]);
        const detectionTaskList = dmDetectionTaskList.map((item) => this.getProtoDetectionTask(item));
        return { totalDetectionTaskCount, detectionTaskList };
    }

    private getDMDetectionTaskStatus(statusValue: _DetectionTaskStatus_Values): DMDetectionTaskStatus {
        switch (statusValue) {
            case _DetectionTaskStatus_Values.REQUESTED:
                return DMDetectionTaskStatus.REQUESTED;
            case _DetectionTaskStatus_Values.PROCESSING:
                return DMDetectionTaskStatus.PROCESSING;
            case _DetectionTaskStatus_Values.DONE:
                return DMDetectionTaskStatus.DONE;
            default:
                throw new ErrorWithStatus("unknown detection task status", status.INVALID_ARGUMENT);
        }
    }

    private getDMDetectionTaskListSortOrder(
        sortOrder: _DetectionTaskListSortOrder_Values
    ): DMDetectionTaskListSortOrder {
        switch (sortOrder) {
            case _DetectionTaskListSortOrder_Values.ID_ASCENDING:
                return DMDetectionTaskListSortOrder.ID_ASCENDING;
            case _DetectionTaskListSortOrder_Values.ID_DESCENDING:
                return DMDetectionTaskListSortOrder.ID_DESCENDING;
            case _DetectionTaskListSortOrder_Values.REQUEST_TIME_ASCENDING:
                return DMDetectionTaskListSortOrder.REQUEST_TIME_ASCENDING;
            case _DetectionTaskListSortOrder_Values.REQUEST_TIME_DESCENDING:
                return DMDetectionTaskListSortOrder.REQUEST_TIME_DESCENDING;
            case _DetectionTaskListSortOrder_Values.UPDATE_TIME_ASCENDING:
                return DMDetectionTaskListSortOrder.UPDATE_TIME_ASCENDING;
            case _DetectionTaskListSortOrder_Values.UPDATE_TIME_DESCENDING:
                return DMDetectionTaskListSortOrder.UPDATE_TIME_DESCENDING;
            default:
                throw new ErrorWithStatus("unknown detection task list sort order", status.INVALID_ARGUMENT);
        }
    }

    private getProtoDetectionTask(dmDetectionTask: DMDetectionTask): DetectionTask {
        return {
            id: dmDetectionTask.id,
            ofImageId: dmDetectionTask.ofImageId,
            requestTime: dmDetectionTask.requestTime,
            status: this.getProtoDetectionTaskStatus(dmDetectionTask.status),
            updateTime: dmDetectionTask.updateTime,
        };
    }

    private getProtoDetectionTaskStatus(statusValue: DMDetectionTaskStatus): _DetectionTaskStatus_Values {
        switch (statusValue) {
            case DMDetectionTaskStatus.REQUESTED:
                return _DetectionTaskStatus_Values.REQUESTED;
            case DMDetectionTaskStatus.PROCESSING:
                return _DetectionTaskStatus_Values.PROCESSING;
            case DMDetectionTaskStatus.DONE:
                return _DetectionTaskStatus_Values.DONE;
            default:
                throw new ErrorWithStatus("unknown detection task status", status.INTERNAL);
        }
    }

    public async updateProcessingDetectionTaskWithUpdateTimeBeforeThresholdToRequested(): Promise<void> {
        const threshold =
            this.timer.getCurrentTime() - this.applicationConfig.detectionTaskProcessingTimeThresholdInMillisecond;
        await this.detectionTaskDM.updateProcessingDetectionTaskWithUpdateTimeBeforeThresholdToRequested(threshold);
    }
}

injected(
    DetectionTaskManagementOperatorImpl,
    DETECTION_TASK_DATA_ACCESSOR_TOKEN,
    DETECTION_TASK_CREATED_PRODUCER_TOKEN,
    TIMER_TOKEN,
    LOGGER_TOKEN,
    APPLICATION_CONFIG_TOKEN
);

export const DETECTION_TASK_MANAGEMENT_OPERATOR_TOKEN = token<DetectionTaskManagementOperator>(
    "DetectionTaskManagementOperator"
);
