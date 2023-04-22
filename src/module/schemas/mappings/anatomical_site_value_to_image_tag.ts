import { LOGGER_TOKEN, promisifyGRPCCall } from "../../../utils";
import { Logger } from "winston";
import { ImageServiceClient } from "../../../proto/gen/ImageService";
import { IMAGE_SERVICE_DM_TOKEN } from "../../../dataaccess/grpc";
import { ImageTag } from "../../../proto/gen/ImageTag";
import { injected, token } from "brandi";

const ANATOMICAL_SITE_TAG_GROUP_NAME = "AI-Anatomical site";

const ImageTagMappingObject = [
    { value: "PHARYNX", tagName: "(AI)Pharynx"},
    { value: "GASTRIC_ANTRUM", tagName: "(AI)Gastric antrum"},
    { value: "GASTRIC_FUNDUS", tagName: "(AI)Gastric fundus"},
    { value: "GASTRIC_BODY", tagName: "(AI)Gastric body"},
    { value: "CARDIA", tagName: "(AI)Cardia"},
    { value: "ESOPHAGUS", tagName: "(AI)Esophagus"},
    { value: "GREATER_CURVATURE", tagName: "(AI)Greater curvature"},
    { value: "LESSER_CURVATURE", tagName: "(AI)Lesser curvature"},
    { value: "DUODENUM_BULB", tagName: "(AI)Duodenum bulb"},
    { value: "DUODENUM", tagName: "(AI)Duodenum"}
]

export interface AnatomicalSiteValueToImageTagMapping {
    mapping(anatomicalSiteValue: string): Promise<ImageTag | undefined>;
}

export class AnatomicalSiteValueToImageTagMappingImpl
    implements AnatomicalSiteValueToImageTagMapping
{
    constructor(
        private readonly imageServiceDM: ImageServiceClient,
        private readonly logger: Logger
    ) {}

    public async mapping(anatomicalSiteValue: string): Promise<ImageTag | undefined> {
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
        return this.mapValue(imageTagListOfImageTagGroup, anatomicalSiteValue);
    }

    private mapValue(imageTagList: ImageTag[], anatomicalSiteValue: string): ImageTag | undefined {
        for (let idx in ImageTagMappingObject) {
            if(anatomicalSiteValue === ImageTagMappingObject[idx].value)
                return imageTagList.filter(imageTag => imageTag.displayName === ImageTagMappingObject[idx].tagName)[0];
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
