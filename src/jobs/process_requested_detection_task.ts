import { injected, token } from "brandi";
import { DETECT_OPERATOR_TOKEN, DetectOperator } from "../module/detect";

export interface ProcessRequestedDetectionTaskJob {
    execute(): Promise<void>;
}

export class ProcessRequestedDetectionTaskJobImpl implements ProcessRequestedDetectionTaskJob {
    constructor(private readonly detectOperator: DetectOperator) {}

    public async execute(): Promise<void> {
        await this.detectOperator.processRequestedDetectionTasks();
    }
}

injected(ProcessRequestedDetectionTaskJobImpl, DETECT_OPERATOR_TOKEN);

export const PROCESS_REQUESTED_DETECTION_TASK_JOB_TOKEN = token<ProcessRequestedDetectionTaskJob>(
    "ProcessRequestedDetectionTaskJob"
);
