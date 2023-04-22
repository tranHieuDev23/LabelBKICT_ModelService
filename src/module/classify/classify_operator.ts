import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import { Logger } from "winston";
import { ClassificationTaskDataAccessor, ClassificationTaskStatus, CLASSIFICATION_TASK_DATA_ACCESSOR_TOKEN } from "../../dataaccess/db/classification_task";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { Image } from "../../proto/gen/Image";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";
import {
  UpperGastrointestinalClassificationServiceClassifier,
  UPPER_GASTROINTESTINAL_CLASSIFICATION_SERVICE_CLASSIFIER_TOKEN
} from "./upper_gastrointestinal_classification_service_classifier";
import { ClassificationType, _ClassificationType_Values } from "../../proto/gen/ClassificationType";
import { ImageTag } from "../../proto/gen/ImageTag";
import { 
  AnatomicalSiteValueToImageTagMapping,
  ANATOMICAL_SITE_VALUE_TO_IMAGE_TAG_MAPPING_TOKEN
} from "../schemas/mappings";

const ANATOMICAL_SITE_TAG_GROUP_NAME = "AI-Anatomical site";

export class ClassificationTaskNotFound extends Error {
  constructor() {
    super("no classification task with the provided classification_task_id found");
  }
}

export interface ClassifyOperator {
  processClassificationTask(classificationTaskId: number, classificationType: ClassificationType): Promise<void>;
}

export class ClassifyOperatorImpl implements ClassifyOperator {
  constructor(
    private readonly classificationTaskDM: ClassificationTaskDataAccessor,
    private readonly imageServiceDM: ImageServiceClient,
    private readonly upperGastrointestinalClassifier: UpperGastrointestinalClassificationServiceClassifier,
    private readonly anatomicalSiteValueToImageTagMapping: AnatomicalSiteValueToImageTagMapping,
    private readonly logger: Logger
  ) { }

  public async processClassificationTask(
    classificationTaskId: number,
    classificationType: ClassificationType
  ): Promise<void> {
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

      const classificationValue: string = await this.upperGastrointestinalClassifier.upperGastrointestinalClassificationFromImage(image, classificationType);
      classificationTask.status = ClassificationTaskStatus.DONE;
      await classificationTaskDM.updateClassificationTask(classificationTask);
      
      // Map to corresponding image tag and add to image
      const imageTag: ImageTag | undefined 
        = await this.anatomicalSiteValueToImageTagMapping.mapping(classificationValue);

      if (imageTag === undefined) {
        this.logger.warn(
            "no image tag with the provided classification value was found, will skip"
        );
        return;
      }
      const { error: addImageTagToImageError, response: addImageTagToImageResponse } =
        await promisifyGRPCCall(
          this.imageServiceDM.addImageTagToImage.bind(this.imageServiceDM),
          {
            imageId: imageId,
            imageTagId: imageTag.id,
          }
        );

      if (addImageTagToImageError !== null) {
        this.logger.error(
          `failed to call image_service.addImageTagToImage(). Cannot add image tag ${imageTag.id} to image ${imageId}`,
          { error: addImageTagToImageError });
        return;
      }
    });
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
  UPPER_GASTROINTESTINAL_CLASSIFICATION_SERVICE_CLASSIFIER_TOKEN,
  ANATOMICAL_SITE_VALUE_TO_IMAGE_TAG_MAPPING_TOKEN,
  LOGGER_TOKEN
);

export const CLASSIFY_OPERATOR_TOKEN = token<ClassifyOperator>("ClassifyOperator");