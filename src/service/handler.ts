import { injected, token } from "brandi";
import { sendUnaryData, status } from "@grpc/grpc-js";
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

export class ModelServiceHandlersFactory {
    constructor(
        private readonly detectionTaskManagementOperator: DetectionTaskManagementOperator,
        private readonly classificationTaskManagementOperator: ClassificationTaskManagementOperator
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

                try {
                    await this.classificationTaskManagementOperator.createClassificationTask(
                        req.imageId
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

                try {
                    await this.classificationTaskManagementOperator.createClassificationTaskBatch(
                        req.imageIdList
                    );
                    callback(null, {});
                } catch (e) {
                    this.handleError(e, callback);
                }
            },

            // GetAnatomicalSiteClassificationTask: async (call, callback) => {
            //     const req = call.request;
            //     if (req.imageId === undefined) {
            //         return callback({
            //             message: "image_id is required",
            //             code: status.INVALID_ARGUMENT,
            //         });
            //     }

            //     try {
            //         await this.classificationTaskManagementOperator.createClassificationTask(
            //             req.imageId
            //         );
            //         callback(null, {});
            //     } catch (e) {
            //         this.handleError(e, callback);
            //     }
            // },

            // GetAnatomicalSiteClassificationTaskBatch: async (call, callback) => {
            //     const req = call.request;
            //     if (req.imageIdList === undefined) {
            //         return callback({
            //             message: "image_id_list is required",
            //             code: status.INVALID_ARGUMENT,
            //         });
            //     }

            //     try {
            //         await this.classificationTaskManagementOperator.createClassificationTaskBatch(
            //             req.imageIdList
            //         );
            //         callback(null, {});
            //     } catch (e) {
            //         this.handleError(e, callback);
            //     }
            // },
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
    CLASSIFICATION_TASK_MANAGEMENT_OPERATOR_TOKEN
);

export const MODEL_SERVICE_HANDLERS_FACTORY_TOKEN =
    token<ModelServiceHandlersFactory>("ModelServiceHandlersFactory");
