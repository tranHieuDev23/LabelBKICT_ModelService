import { injected, token } from "brandi";
import { ServerUnaryCall, sendUnaryData, status } from "@grpc/grpc-js";
import { ErrorWithStatus } from "../utils";
import {
    DetectionTaskManagementOperator,
    DETECTION_TASK_MANAGEMENT_OPERATOR_TOKEN,
} from "../module/detection_task_management";
import { ModelServiceHandlers } from "../proto/gen/ModelService";
import { 
    ClassificationTaskManagementOperator,
    CLASSIFICATION_TASK_MANAGEMENT_OPERATOR_TOKEN
} from "../module/classification_task_management";
import { 
    ClassificationTypeManagementOperator,
    CLASSIFICATION_TYPE_MANAGEMENT_OPERATOR_TOKEN
} from "../module/classification_type_management";
import { GetClassificationTypeByDisplayNameRequest__Output } from "../proto/gen/GetClassificationTypeByDisplayNameRequest";
import { GetClassificationTypeByDisplayNameResponse } from "../proto/gen/GetClassificationTypeByDisplayNameResponse";

export class ModelServiceHandlersFactory {
    constructor(
        private readonly detectionTaskManagementOperator: DetectionTaskManagementOperator,
        private readonly classificationTaskManagementOperator: ClassificationTaskManagementOperator,
        private readonly classificationTypeManagementOperator: ClassificationTypeManagementOperator
        ) {}

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
                    await this.detectionTaskManagementOperator.createDetectionTask(
                        req.imageId
                    );
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
                    await this.detectionTaskManagementOperator.createDetectionTaskBatch(
                        req.imageIdList
                    );
                    callback(null, {});
                } catch (e) {
                    this.handleError(e, callback);
                }
            },

            CreateClassificationTask: async (call, callback) => {
                const req = call.request;
                if (req.imageId === undefined) {
                    return callback({
                        message: "image_id is required",
                        code: status.INVALID_ARGUMENT,
                    });
                }
                if (req.classificationTypeId == undefined) {
                    return callback({
                        message: "classification_type is required",
                        code: status.INVALID_ARGUMENT
                    });
                }

                try {
                    await this.classificationTaskManagementOperator.createClassificationTask(
                        req.imageId,
                        req.classificationTypeId
                    );
                    callback(null, {});
                } catch (e) {
                    this.handleError(e, callback);
                }
            },

            CreateClassificationTaskBatch: async (call, callback) => {
                const req = call.request;
                if (req.imageIdList === undefined) {
                    return callback({
                        message: "image_id_list is required",
                        code: status.INVALID_ARGUMENT,
                    });
                }
                if (req.classificationTypeId === undefined) {
                    return callback({
                        message: "classification_type_id is required",
                        code: status.INVALID_ARGUMENT
                    });
                }

                try {
                    await this.classificationTaskManagementOperator.createClassificationTaskBatch(
                        req.imageIdList,
                        req.classificationTypeId
                    );
                    callback(null, {});
                } catch (e) {
                    this.handleError(e, callback);
                }
            },

            GetClassificationType: async (call, callback) => {
                const req = call.request;
                if (req.classificationTypeId === undefined) {
                    return callback({
                        message: "classification_type_id is required",
                        code: status.INVALID_ARGUMENT
                    });
                }
                try {
                    const classificationType = await this.classificationTypeManagementOperator.getClassificationType(
                        req.classificationTypeId
                    );
                    callback(null, { classificationType });
                } catch (e) {
                    this.handleError(e, callback);
                }
            },

            GetClassificationTypeList: async (call, callback) => {
                try {
                    const classificationTypeList = await this.classificationTypeManagementOperator.getClassificationTypeList();
                    callback(null, { classificationTypeList });
                } catch (e) {
                    this.handleError(e, callback);
                }
            },
            GetClassificationTypeByDisplayName: function (call: ServerUnaryCall<GetClassificationTypeByDisplayNameRequest__Output, GetClassificationTypeByDisplayNameResponse>, callback: sendUnaryData<GetClassificationTypeByDisplayNameResponse>): void {
                throw new Error("Function not implemented.");
            }
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

injected(
    ModelServiceHandlersFactory,
    DETECTION_TASK_MANAGEMENT_OPERATOR_TOKEN,
    CLASSIFICATION_TASK_MANAGEMENT_OPERATOR_TOKEN,
    CLASSIFICATION_TYPE_MANAGEMENT_OPERATOR_TOKEN
);

export const MODEL_SERVICE_HANDLERS_FACTORY_TOKEN =
    token<ModelServiceHandlersFactory>("ModelServiceHandlersFactory");
