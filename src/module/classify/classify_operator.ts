import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import { Logger, log } from "winston";
import { ClassificationTaskDataAccessor, ClassificationTaskStatus, CLASSIFICATION_TASK_DATA_ACCESSOR_TOKEN } from "../../dataaccess/db/classification_task";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { Image } from "../../proto/gen/Image";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";
import {
  UpperGastrointestinalClassificationServiceClassifier,
  UPPER_GASTROINTESTINAL_CLASSIFICATION_SERVICE_CLASSIFIER_TOKEN
} from "./upper_gastrointestinal_classification_service_classifier";
import { ClassificationType } from "../../proto/gen/ClassificationType";
import { ImageTag } from "../../proto/gen/ImageTag";
import { 
  AnatomicalSiteValueToImageTagMapping,
  ANATOMICAL_SITE_VALUE_TO_IMAGE_TAG_MAPPING_TOKEN
} from "../schemas/mappings";
import { 
  ClassificationTypeDataAccessor,
  CLASSIFICATION_TYPE_DATA_ACCESSOR_TOKEN
} from "../../dataaccess/db";
import { ImageTagGroup } from "../../proto/gen/ImageTagGroup";

const ANATOMICAL_SITE_TAG_GROUP_NAME = "AI-Anatomical site";

export class ClassificationTaskNotFound extends Error {
  constructor() {
    super("no classification task with the provided classification_task_id found");
  }
}

export class ClassificationTypeNotFound extends Error {
  constructor() {
    super("no classification type with the provided classification_type_id found")
  }
}

export interface ClassifyOperator {
  processClassificationTask(classificationTaskId: number, classificationTypeId: number): Promise<void>;
}

export class ClassifyOperatorImpl implements ClassifyOperator {
  constructor(
    private readonly classificationTaskDM: ClassificationTaskDataAccessor,
    private readonly classificationTypeDM: ClassificationTypeDataAccessor,
    private readonly imageServiceDM: ImageServiceClient,
    private readonly upperGastrointestinalClassifier: UpperGastrointestinalClassificationServiceClassifier,
    private readonly anatomicalSiteValueToImageTagMapping: AnatomicalSiteValueToImageTagMapping,
    private readonly logger: Logger
  ) { }

  public async processClassificationTask(
    classificationTaskId: number,
    classificationTypeId: number
  ): Promise<void> {
    // return 
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

      const classificationType = 
        await this.classificationTypeDM.getClassificationType(classificationTypeId);
      if (classificationType === null) {
        this.logger.error(
          "no classification type with classification_type_id found",
          { classificationTypeId }
        );
        throw new ClassificationTypeNotFound();
      }

      const imageId = classificationTask.ofImageId;
      const getImageResponse = await this.getImage(imageId);
      if (getImageResponse === null) {
        this.logger.warn(
            "no image with the provided id was found, will skip"
        );
        classificationTask.status = ClassificationTaskStatus.DONE;
        await classificationTaskDM.updateClassificationTask(classificationTask);
        return;
      }

      const classificationValue: string = await this.upperGastrointestinalClassifier.upperGastrointestinalClassificationFromImage(getImageResponse.image, classificationType);
      classificationTask.status = ClassificationTaskStatus.DONE;
      await classificationTaskDM.updateClassificationTask(classificationTask);
      
      // Map to corresponding image tag and add to image
      const imageTag: ImageTag | undefined 
        = await this.anatomicalSiteValueToImageTagMapping.mapping(classificationType, classificationValue);
      if (imageTag === undefined) {
        this.logger.warn(
            "no image tag with the provided classification value was found, will skip"
        );
        return;
      }

      const imageTagListOfImage = getImageResponse.imageTagList;
      
      if (imageTagListOfImage.length !== 0) {
        const getImageTagGroupListResponse = await this.getImageTagGroupList();
        if (getImageTagGroupListResponse === null) {
          this.logger.warn(
            "called image_service.getImageTagGroupList(), but no image tag group was found",
            {}
          );
          return;
        }

        for (let imageTagGroupIdx in getImageTagGroupListResponse?.classificationTypeList || []) {
          if (getImageTagGroupListResponse.classificationTypeList[imageTagGroupIdx].findIndex(
              (classificationType) => classificationType.classificationTypeId === classificationTypeId
            ) !== -1) {

              for (let imageTagOfImage of imageTagListOfImage) {
                if (getImageTagGroupListResponse.imageTagList[imageTagGroupIdx].findIndex(
                  (imageTag) => imageTag.id === imageTagOfImage.id
                ) !== -1) {
                  await this.removeImageTagOfImage(imageId, imageTag.id || 0)
                  break;
                }
              }
          }
        }
      }

      const { error: addImageTagToImageError } =
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

  private async getImage(imageId: number): Promise<
  {
    image: Image;
    imageTagList: ImageTag[];
  } | null> {
    const { error: getImageError, response: getImageResponse } =
      await promisifyGRPCCall(
        this.imageServiceDM.getImage.bind(this.imageServiceDM),
        { 
          id: imageId,
          withImageTag: true,
          withRegion: false
        }
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
    return { image: getImageResponse.image, imageTagList: getImageResponse.imageTagList || [] };
  }

  private async getImageTagGroupList(): Promise<{
    imageTagGroupList: ImageTagGroup[],
    imageTagList: ImageTag[][],
    classificationTypeList: ClassificationType[][]
  } | null > {
    const { error: getImageTagGroupListError, response: getImageTagGroupListResponse } =
      await promisifyGRPCCall(
        this.imageServiceDM.getImageTagGroupList.bind(this.imageServiceDM),
        {
          withImageTag: true,
          withImageType: false,
          withClassificationType: true
        }
      );
    if (getImageTagGroupListError !== null) {
      if (getImageTagGroupListError.code === status.NOT_FOUND) {
        this.logger.warn(
          "called image_service.getImageTagGroupList(), but no image tag group was found",
          { error: getImageTagGroupListError }
        );
        return null;
      }

      this.logger.error("failed to call image_service.getImageTagGroupList()", {
        error: getImageTagGroupListError,
      });
      throw getImageTagGroupListError;
    }

    const imageTagGroupList = getImageTagGroupListResponse?.imageTagGroupList || [];
    const imageTagList = getImageTagGroupListResponse?.imageTagListOfImageTagGroupList?.map(
          (imageTagList) => imageTagList.imageTagList || []
      ) || [];
    const classificationTypeList = getImageTagGroupListResponse?.classificationTypeListOfImageTagGroupList?.map(
          (classificationTypeList) => classificationTypeList.classificationTypeList || []
      ) || [];

    return {
      imageTagGroupList: imageTagGroupList,
      imageTagList: imageTagList,
      classificationTypeList: classificationTypeList
    };
  }

  private async removeImageTagOfImage(
    imageId: number,
    imageTagId: number
  ): Promise<void> {
    const { error: removeImageTagFromImageError } = await promisifyGRPCCall(
      this.imageServiceDM.removeImageTagFromImage.bind(this.imageServiceDM),
      { imageId: imageId, imageTagId: imageTagId }
    );
    if (removeImageTagFromImageError !== null) {
      this.logger.error(
        "failed to call image_service.removeImageTagFromImage()",
        { error: removeImageTagFromImageError }
      );
      throw removeImageTagFromImageError;
    }
  }
}

injected(
  ClassifyOperatorImpl,
  CLASSIFICATION_TASK_DATA_ACCESSOR_TOKEN,
  CLASSIFICATION_TYPE_DATA_ACCESSOR_TOKEN,
  IMAGE_SERVICE_DM_TOKEN,
  UPPER_GASTROINTESTINAL_CLASSIFICATION_SERVICE_CLASSIFIER_TOKEN,
  ANATOMICAL_SITE_VALUE_TO_IMAGE_TAG_MAPPING_TOKEN,
  LOGGER_TOKEN
);

export const CLASSIFY_OPERATOR_TOKEN = token<ClassifyOperator>("ClassifyOperator");