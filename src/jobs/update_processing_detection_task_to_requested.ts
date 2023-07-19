import { injected, token } from "brandi";
import {
    DETECTION_TASK_MANAGEMENT_OPERATOR_TOKEN,
    DetectionTaskManagementOperator,
} from "../module/detection_task_management";

export interface UpdateProcessingDetectionTaskToRequestedJob {
    execute(): Promise<void>;
}

export class UpdateProcessingDetectionTaskToRequestedJobImpl implements UpdateProcessingDetectionTaskToRequestedJob {
    constructor(private readonly detectionTaskManagementOperator: DetectionTaskManagementOperator) {}

    public async execute(): Promise<void> {
        this.detectionTaskManagementOperator.updateProcessingDetectionTaskWithUpdateTimeBeforeThresholdToRequested();
    }
}

injected(UpdateProcessingDetectionTaskToRequestedJobImpl, DETECTION_TASK_MANAGEMENT_OPERATOR_TOKEN);

export const UPDATE_PROCESSING_DETECTION_TASK_TO_REQUESTED_TOKEN = token<UpdateProcessingDetectionTaskToRequestedJob>(
    "UpdateProcessingDetectionTaskToRequestedJob"
);
