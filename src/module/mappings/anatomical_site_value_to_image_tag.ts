import { ErrorWithStatus, LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";
import { Logger } from "winston";
import { AnatomicalSite } from "../../dataaccess/db";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ImageTag } from "../../proto/gen/ImageTag";
import { injected, token } from "brandi";
import { status } from "@grpc/grpc-js";

const ANATOMICAL_SITE_TAG_GROUP_NAME = "AI-Anatomical site";
enum ImageTagMapping {
    AI_PHARYNX = "(AI)Pharynx",
    AI_GASTRIC_ANTRUM = "(AI)Gastric antrum",
    AI_GASTRIC_FUNDUS = "(AI)Gastric fundus",
    AI_GASTRIC_BODY = "(AI)Gastric body",
    AI_CARDIA = "(AI)Cardia",
    AI_ESOPHAGUS = "(AI)Esophagus",
    AI_GREATER_CURVATURE = "(AI)Greater curvature",
    AI_LESSER_CURVATURE = "(AI)Lesser curvature",
    AI_DUODENUM_BULB = "(AI)Duodenum bulb",
    AI_DUODENUM = "(AI)Duodenum"
}

export interface AnatomicalSiteValueToImageTagMapping {
    mapping(anatomicalSiteValue: AnatomicalSite): Promise<ImageTag>;
}

export class AnatomicalSiteValueToImageTagMappingImpl
    implements AnatomicalSiteValueToImageTagMapping
{
    constructor(
        private readonly imageServiceDM: ImageServiceClient,
        private readonly logger: Logger
    ) {}

    public async mapping(anatomicalSiteValue: AnatomicalSite): Promise<ImageTag> {
        const { error: getImageTagGroupListError, response: getImageTagGroupListResponse }
            = await promisifyGRPCCall(
                this.imageServiceDM.getImageTagGroupList.bind(this.imageServiceDM),
                { withImageTag: true, withImageType: false}
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
        const imageTagList = getImageTagGroupListResponse.imageTagListOfImageTagGroupList || [];

        const imageTagGroupIdx = imageTagGroupList.findIndex(imageTagGroup => imageTagGroup.displayName === ANATOMICAL_SITE_TAG_GROUP_NAME);
        if (imageTagGroupIdx === -1) {
            this.logger.error(`Image tag group with display name ${ANATOMICAL_SITE_TAG_GROUP_NAME} corresponds to the classification type not found.`);
            throw new Error(`Image tag group with display name ${ANATOMICAL_SITE_TAG_GROUP_NAME} corresponds to the classification type not found.`);
        }
        const imageTagListOfImageTagGroup = imageTagList[imageTagGroupIdx].imageTagList || [];
        switch (anatomicalSiteValue) {
            case AnatomicalSite.PHARYNX:
                return imageTagListOfImageTagGroup.filter(
                    imageTag => imageTag.displayName === ImageTagMapping.AI_PHARYNX)[0];
            case AnatomicalSite.GASTRIC_ANTRUM:
                return imageTagListOfImageTagGroup.filter(
                    imageTag => imageTag.displayName === ImageTagMapping.AI_GASTRIC_ANTRUM)[0];
            case AnatomicalSite.GASTRIC_FUNDUS:
                return imageTagListOfImageTagGroup.filter(
                    imageTag => imageTag.displayName === ImageTagMapping.AI_GASTRIC_FUNDUS)[0];
            case AnatomicalSite.GASTRIC_BODY:
                return imageTagListOfImageTagGroup.filter(
                    imageTag => imageTag.displayName === ImageTagMapping.AI_GASTRIC_BODY)[0];
            case AnatomicalSite.CARDIA:
                return imageTagListOfImageTagGroup.filter(
                    imageTag => imageTag.displayName === ImageTagMapping.AI_CARDIA)[0];
            case AnatomicalSite.ESOPHAGUS:
                return imageTagListOfImageTagGroup.filter(
                    imageTag => imageTag.displayName === ImageTagMapping.AI_ESOPHAGUS)[0];
            case AnatomicalSite.GREATER_CURVATURE:
                return imageTagListOfImageTagGroup.filter(
                    imageTag => imageTag.displayName === ImageTagMapping.AI_GREATER_CURVATURE)[0];
            case AnatomicalSite.LESSER_CURVATURE:
                return imageTagListOfImageTagGroup.filter(
                    imageTag => imageTag.displayName === ImageTagMapping.AI_LESSER_CURVATURE)[0];
            case AnatomicalSite.DUODENUM_BULB:
                return imageTagListOfImageTagGroup.filter(
                    imageTag => imageTag.displayName === ImageTagMapping.AI_DUODENUM_BULB)[0];
            case AnatomicalSite.DUODENUM:
                return imageTagListOfImageTagGroup.filter(
                    imageTag => imageTag.displayName === ImageTagMapping.AI_DUODENUM)[0];
            default:
                this.logger.error("invalid anatomical site value", { anatomicalSiteValue });
                throw new ErrorWithStatus(
                    `Invalid anatomical site value ${anatomicalSiteValue}`,
                    status.INTERNAL
                );
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
