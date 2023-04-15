import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import { Logger } from "winston";
import { ClassificationTaskDataAccessor, ClassificationTaskStatus, CLASSIFICATION_TASK_DATA_ACCESSOR_TOKEN } from "../../dataaccess/db/classification_task";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { Image } from "../../proto/gen/Image";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";
import {
  GastricClassificationServiceClassifier,
  GASTRIC_CLASSIFICATION_SERVICE_CLASSIFIER_TOKEN
} from "./gastric_classification_service_classifier";

export class ClassificationTaskNotFound extends Error {
  constructor() {
    super("no classification task with the provided classification_task_id found");
  }
}

export interface ClassifyOperator {
  processClassificationTask(classificationTaskId: number): Promise<void>;
}

export class ClassifyOperatorImpl implements ClassifyOperator {
  constructor(
    private readonly classificationTaskDM: ClassificationTaskDataAccessor,
    private readonly imageServiceDM: ImageServiceClient,
    private readonly classifier: GastricClassificationServiceClassifier,
    private readonly logger: Logger
  ) { }

  public async processClassificationTask(classificationTaskId: number): Promise<void> {
    await this.classificationTaskDM.withTransaction(async (classificationTaskDM) => {
      const classificationTask =
        await classificationTaskDM.getClassificationTaskWithXLock(
          classificationTaskId
        );
      if (classificationTask === null) {
        this.logger.error(
          "no classification task with classification_task_id found",
          { classificationTaskId }
        );
        throw new ClassificationTaskNotFound();
      }
      if (classificationTask.status === ClassificationTaskStatus.DONE) {
        this.logger.error(
          "classification task with classification_task_id already has status of done",
          { classificationTaskId }
        );
        return;
      }

      const imageId = classificationTask.ofImageId;
      const image = await this.getImage(imageId);
      if (image === null) {
        this.logger.warn(
            "no image with the provided id was found, will skip"
        );
        classificationTask.status = ClassificationTaskStatus.DONE;
        await classificationTaskDM.updateClassificationTask(classificationTask);
        return;
      }

    // TODO: xu ly kqua tra ve
    console.log("tao classification task thanh cong", classificationTask.classificationType)
    const classificationResult =
      await this.classifier.gastricClassificationFromImage(image, classificationTask.classificationType);

    classificationTask.status = ClassificationTaskStatus.DONE;
    await classificationTaskDM.updateClassificationTask(classificationTask);
    })
  }

  private async getImage(imageId: number): Promise<Image | null> {
    const { error: getImageError, response: getImageResponse } =
      await promisifyGRPCCall(
        this.imageServiceDM.getImage.bind(this.imageServiceDM),
        { id: imageId }
      );
    if (getImageError !== null) {
      if (getImageError.code === status.NOT_FOUND) {
        this.logger.warn(
          "called image_service.getImage(), but no image was found",
          { error: getImageError }
        );
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
}

injected(
  ClassifyOperatorImpl,
  CLASSIFICATION_TASK_DATA_ACCESSOR_TOKEN,
  IMAGE_SERVICE_DM_TOKEN,
  GASTRIC_CLASSIFICATION_SERVICE_CLASSIFIER_TOKEN,
  LOGGER_TOKEN
);

export const CLASSIFY_OPERATOR_TOKEN = token<ClassifyOperator>("ClassifyOperator");