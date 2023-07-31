import { LOGGER_TOKEN, promisifyGRPCCall } from "../../../utils";
import { Logger, log } from "winston";
import { ImageServiceClient } from "../../../proto/gen/ImageService";
import { IMAGE_SERVICE_DM_TOKEN } from "../../../dataaccess/grpc";
import { ImageTag } from "../../../proto/gen/ImageTag";
import { injected, token } from "brandi";
import { ClassificationType } from "../../../dataaccess/db";

enum ClassificationTypeDisplayName {
    ANATOMICAL_SITE = "Anatomical site",
    LESION_TYPE = "Lesion",
    HP_STATUS = "HP",
}

const ImageTagMappingFromAnatomicalSiteObject = [
    { value: "PHARYNX", tagName: "(AI)Pharynx" },
    { value: "GASTRIC_ANTRUM", tagName: "(AI)Gastric antrum" },
    { value: "GASTRIC_FUNDUS", tagName: "(AI)Gastric fundus" },
    { value: "GASTRIC_BODY", tagName: "(AI)Gastric body" },
    { value: "CARDIA", tagName: "(AI)Cardia" },
    { value: "ESOPHAGUS", tagName: "(AI)Esophagus" },
    { value: "GREATER_CURVATURE", tagName: "(AI)Greater curvature" },
    { value: "LESSER_CURVATURE", tagName: "(AI)Lesser curvature" },
    { value: "DUODENUM_BULB", tagName: "(AI)Duodenum bulb" },
    { value: "DUODENUM", tagName: "(AI)Duodenum" }
];

const ImageTagMappingFromLesionObject = [
    { value: "NON_LESION", tagName: "(AI)Non Lesion" },
    { value: "ESOPHAGEAL_CANCER", tagName: "(AI)Esophageal Cancel" },
    { value: "REFLUX_ESOPHAGITIS", tagName: "(AI)Reflux Esophagitis" },
    { value: "DUODENAL_ULCER", tagName: "(AI)Duodenal Ulcer" },
    { value: "STOMACH_CANCER", tagName: "(AI)Stomach Cancel" },
    { value: "GASTRITIS", tagName: "(AI)Gastritis" }
];

const ImageTagMappingFromHPObject = [
    { value: "NEGATIVE", tagName: "(AI)Negative" },
    { value: "POSITIVE", tagName: "(AI)Positive" }
];

export interface AnatomicalSiteValueToImageTagMapping {
    mapping(classificationType: ClassificationType, classificationValue: string): Promise<ImageTag | undefined>;
}

export class AnatomicalSiteValueToImageTagMappingImpl
    implements AnatomicalSiteValueToImageTagMapping
{
    constructor(
        private readonly imageServiceDM: ImageServiceClient,
        private readonly logger: Logger
    ) {}

    public async mapping(classificationType: ClassificationType, classificationValue: string): Promise<ImageTag | undefined> {
        const { error: getImageTagGroupListError, response: getImageTagGroupListResponse }
            = await promisifyGRPCCall(
                this.imageServiceDM.getImageTagGroupList.bind(this.imageServiceDM),
                { withImageTag: true, withImageType: false, withClassificationType: true }
            );

        if (getImageTagGroupListError !== null) {
            this.logger.error("failed to call image_service.getImageTagGroupList()", {
                error: getImageTagGroupListError,
            });
            throw getImageTagGroupListError;
        }

        if (getImageTagGroupListResponse === undefined) {
            this.logger.error("invalid response from image_service.getImageTagGroupList()");
            throw new Error("invalid response from image_service.getImageTagGroupList()");
        }

        const imageTagGroupList = getImageTagGroupListResponse.imageTagGroupList || [];
        const imageTagList = getImageTagGroupListResponse?.imageTagListOfImageTagGroupList?.map(
                  (imageTagList) => imageTagList.imageTagList || []
              ) || [];
        const classificationTypeList = getImageTagGroupListResponse?.classificationTypeListOfImageTagGroupList?.map(
                (classificationTypeList) => classificationTypeList.classificationTypeList || []
            ) || [];
        const classificationTypeIdx = classificationTypeList.findIndex(classificationTypeOfImageTagGroup => {
            if (classificationTypeOfImageTagGroup.length !== 0) {
                return classificationTypeOfImageTagGroup[0].classificationTypeId == classificationType.classificationTypeId;
            }
        });
        
        if (classificationTypeIdx === -1) {
            this.logger.error(`Failed to find image tag group that corresponds to the classification type ${classificationType} not found.`);
            throw new Error(`Failed to find image tag group that corresponds to the classification type ${classificationType} not found.`);
        }
        const imageTagListOfImageTagGroup = imageTagList[classificationTypeIdx] || [];
        if (classificationType.displayName === ClassificationTypeDisplayName.ANATOMICAL_SITE)
            return this.mapAnatomicalSiteValue(imageTagListOfImageTagGroup, classificationValue);
        else if (classificationType.displayName === ClassificationTypeDisplayName.LESION_TYPE)
            return this.mapLesionValue(imageTagListOfImageTagGroup, classificationValue);
        else
            return this.mapHPValue(imageTagListOfImageTagGroup, classificationValue);
            
    }

    private mapAnatomicalSiteValue(imageTagList: ImageTag[], anatomicalSiteValue: string): ImageTag | undefined {
        for (let idx in ImageTagMappingFromAnatomicalSiteObject) {
            if(anatomicalSiteValue === ImageTagMappingFromAnatomicalSiteObject[idx].value)
                return imageTagList.filter(imageTag => imageTag.displayName === ImageTagMappingFromAnatomicalSiteObject[idx].tagName)[0];
        }
    }

    private mapLesionValue(imageTagList: ImageTag[], anatomicalSiteValue: string): ImageTag | undefined {
        for (let idx in ImageTagMappingFromLesionObject) {
            if(anatomicalSiteValue === ImageTagMappingFromLesionObject[idx].value)
                return imageTagList.filter(imageTag => imageTag.displayName === ImageTagMappingFromLesionObject[idx].tagName)[0];
        }
    }

    private mapHPValue(imageTagList: ImageTag[], anatomicalSiteValue: string): ImageTag | undefined {
        for (let idx in ImageTagMappingFromHPObject) {
            if(anatomicalSiteValue === ImageTagMappingFromHPObject[idx].value)
                return imageTagList.filter(imageTag => imageTag.displayName === ImageTagMappingFromHPObject[idx].tagName)[0];
        }
    }
}

injected(
    AnatomicalSiteValueToImageTagMappingImpl,
    IMAGE_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const ANATOMICAL_SITE_VALUE_TO_IMAGE_TAG_MAPPING_TOKEN =
    token<AnatomicalSiteValueToImageTagMapping>(
        "AnatomicalSiteValueToImageTagMapping"
    )
