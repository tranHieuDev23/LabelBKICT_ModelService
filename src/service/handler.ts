import { injected, token } from "brandi";
import { sendUnaryData, status } from "@grpc/grpc-js";
import { ErrorWithStatus } from "../utils";
import {
    DetectionTaskManagementOperator,
    DETECTION_TASK_MANAGEMENT_OPERATOR_TOKEN,
} from "../module/detection_task_management";
import { ModelServiceHandlers } from "../proto/gen/ModelService";
import { _DetectionTaskListSortOrder_Values } from "../proto/gen/DetectionTaskListSortOrder";

const GET_DETECTION_TASK_LIST_DEFAULT_OFFSET = 0;
const GET_DETECTION_TASK_LIST_DEFAULT_LIMIT = 10;

export class ModelServiceHandlersFactory {
    constructor(private readonly detectionTaskManagementOperator: DetectionTaskManagementOperator) {}

    public getModelServiceHandlers(): ModelServiceHandlers {
        const handler: ModelServiceHandlers = {
            CreateDetectionTask: async (call, callback) => {
                const req = call.request;
                if (req.imageId === undefined) {
                    return callback({
                        message: "image_id is required",
                        code: status.INVALID_ARGUMENT,
                    });
                }

                try {
                    await this.detectionTaskManagementOperator.createDetectionTask(req.imageId);
                    callback(null, {});
                } catch (e) {
                    this.handleError(e, callback);
                }
            },

            CreateDetectionTaskBatch: async (call, callback) => {
                const req = call.request;
                if (req.imageIdList === undefined) {
                    return callback({
                        message: "image_id_list is required",
                        code: status.INVALID_ARGUMENT,
                    });
                }

                try {
                    await this.detectionTaskManagementOperator.createDetectionTaskBatch(req.imageIdList);
                    callback(null, {});
                } catch (e) {
                    this.handleError(e, callback);
                }
            },

            GetDetectionTaskList: async (call, callback) => {
                const req = call.request;
                if (req.ofImageIdList === undefined) {
                    return callback({
                        message: "of_image_id_list is required",
                        code: status.INVALID_ARGUMENT,
                    });
                }
                if (req.statusList === undefined) {
                    return callback({
                        message: "status_list is required",
                        code: status.INVALID_ARGUMENT,
                    });
                }

                const offset = req.offset || GET_DETECTION_TASK_LIST_DEFAULT_OFFSET;
                const limit = req.limit || GET_DETECTION_TASK_LIST_DEFAULT_LIMIT;
                const sortOrder = req.sortOrder || _DetectionTaskListSortOrder_Values.ID_DESCENDING;

                try {
                    const { detectionTaskList, totalDetectionTaskCount } =
                        await this.detectionTaskManagementOperator.getDetectionTaskList(
                            offset,
                            limit,
                            req.ofImageIdList,
                            req.statusList,
                            sortOrder
                        );
                    callback(null, {
                        detectionTaskList,
                        totalDetectionTaskCount,
                    });
                } catch (e) {
                    this.handleError(e, callback);
                }
            },
        };
        return handler;
    }

    private handleError(e: unknown, callback: sendUnaryData<any>) {
        if (e instanceof ErrorWithStatus) {
            return callback({
                message: e.message,
                code: e.status,
            });
        } else if (e instanceof Error) {
            return callback({
                message: e.message,
                code: status.INTERNAL,
            });
        } else {
            return callback({
                code: status.INTERNAL,
            });
        }
    }
}

injected(ModelServiceHandlersFactory, DETECTION_TASK_MANAGEMENT_OPERATOR_TOKEN);

export const MODEL_SERVICE_HANDLERS_FACTORY_TOKEN = token<ModelServiceHandlersFactory>("ModelServiceHandlersFactory");
