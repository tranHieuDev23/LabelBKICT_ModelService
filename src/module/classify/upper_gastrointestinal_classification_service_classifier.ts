import { injected, token } from "brandi";
import sharp from "sharp";
import { Logger } from "winston";
import { POLYP_DETECTION_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { BucketDM, ORIGINAL_IMAGE_S3_DM_TOKEN } from "../../dataaccess/s3";
import { ClassificationType } from "../../proto/gen/ClassificationType";
import { _com_vdsense_polypnet_proto_AnatomicalSite_Values } from "../../proto/gen/com/vdsense/polypnet/proto/AnatomicalSite";
import { _com_vdsense_polypnet_proto_LesionType_Values } from "../../proto/gen/com/vdsense/polypnet/proto/LesionType";
import { PolypDetectionRequest } from "../../proto/gen/com/vdsense/polypnet/proto/PolypDetectionRequest";
import { PolypDetectionResponse } from "../../proto/gen/com/vdsense/polypnet/proto/PolypDetectionResponse";
import { PolypDetectionServiceClient } from "../../proto/gen/com/vdsense/polypnet/proto/PolypDetectionService";
import { Image } from "../../proto/gen/Image";
import { LOGGER_TOKEN, promisifyGRPCCall, Timer, TIMER_TOKEN } from "../../utils";
import {
    AnatomicalSiteProtoToAnatomicalSiteConverter,
    ANATOMICAL_SITE_PROTO_TO_ANATOMICAL_SITE_CONVERTER_TOKEN,
    LesionTypeProtoToLesionTypeConverter,
    LESION_TYPE_PROTO_TO_LESION_TYPE_CONVERTER_TOKEN,
    HpStatusProtoToHpStatusConverter,
    HP_STATUS_PROTO_TO_HP_STATUS_CONVERTER_TOKEN
} from "../schemas/converters";

enum ClassificationTypeDisplayName {
    ANATOMICAL_SITE = "Anatomical site",
    LESION_TYPE = "Lesion",
    HP_STATUS = "HP",
}

export interface UpperGastrointestinalClassificationServiceClassifier {
    upperGastrointestinalClassificationFromImage(
        image: Image,
        classificationType: ClassificationType
    ): Promise<string>;
}

export class UpperGastrointestinalClassificationServiceClassifierImpl
    implements UpperGastrointestinalClassificationServiceClassifier {
    constructor(
        private readonly polypDetectionServiceDM: PolypDetectionServiceClient,
        private readonly anatomicalSiteProtoToAnatomicalSiteConverter: AnatomicalSiteProtoToAnatomicalSiteConverter,
        private readonly lesionTypeProtoToLesionTypeConverter: LesionTypeProtoToLesionTypeConverter,
        private readonly hpStatusProtoToHpStatusConverter: HpStatusProtoToHpStatusConverter,
        private readonly originalImageS3DM: BucketDM,
        private readonly timer: Timer,
        private readonly logger: Logger
    ) { }

    public async upperGastrointestinalClassificationFromImage(
        image: Image,
        classificationType: ClassificationType
    ): Promise<string> {
        if (image.originalImageFilename === undefined) {
            this.logger.error("image does not have original image file name", {
                imageId: image.id,
            });
            throw new Error("image does not have original image file name");
        }
        const imageData = await this.originalImageS3DM.getFile(
            image.originalImageFilename
            );
        const polypDetectResponse = await this.getPolypDetectResponse(
            imageData,
            this.polypDetectionServiceDM
        );
        const imageSharp = sharp(imageData);

        if (image.id === undefined) {
            this.logger.error("image does not have id", {
                imageId: image.id,
            });
            throw new Error("image does not have id");
        }

        let { anatomicalSite, lesionType, hpStatus } = polypDetectResponse;
        
        if (classificationType.displayName === ClassificationTypeDisplayName.ANATOMICAL_SITE)
            return this.anatomicalSiteProtoToAnatomicalSiteConverter.convert(anatomicalSite as any);
        else if (classificationType.displayName === ClassificationTypeDisplayName.LESION_TYPE)
            return this.lesionTypeProtoToLesionTypeConverter.convert(lesionType as any);
        else return this.hpStatusProtoToHpStatusConverter.convert(hpStatus as any);
    }

    private async getPolypDetectResponse(
        imageBuffer: Buffer,
        polypDetectionServiceClient: PolypDetectionServiceClient
    ): Promise<PolypDetectionResponse> {
        const request: PolypDetectionRequest = {
            image: { content: imageBuffer },
        };
        const { error: batchPolypDetectError, response: batchPolypDetectResponse } = await promisifyGRPCCall(
            polypDetectionServiceClient.batchPolypDetect.bind(polypDetectionServiceClient),
            { requests: [request] }
        );
        if (batchPolypDetectError !== null) {
            this.logger.error("failed to call PolypDetectionService.BatchPolypDetect()", {
                error: batchPolypDetectError,
            });
            throw batchPolypDetectError;
        }
        const responseList = batchPolypDetectResponse?.responses || [];
        const polypDetectResponse = responseList[0];
        if (polypDetectResponse === undefined) {
            this.logger.error("invalid response from PolypDetectionService.BatchPolypDetect()", {
                response: batchPolypDetectResponse,
            });
        }
        return polypDetectResponse;
    }
}

injected(
    UpperGastrointestinalClassificationServiceClassifierImpl,
    POLYP_DETECTION_SERVICE_DM_TOKEN,
    ANATOMICAL_SITE_PROTO_TO_ANATOMICAL_SITE_CONVERTER_TOKEN,
    LESION_TYPE_PROTO_TO_LESION_TYPE_CONVERTER_TOKEN,
    HP_STATUS_PROTO_TO_HP_STATUS_CONVERTER_TOKEN,
    ORIGINAL_IMAGE_S3_DM_TOKEN,
    TIMER_TOKEN,
    LOGGER_TOKEN
);

export const UPPER_GASTROINTESTINAL_CLASSIFICATION_SERVICE_CLASSIFIER_TOKEN = 
    token<UpperGastrointestinalClassificationServiceClassifier>("UpperGastrointestinalClassificationServiceClassifier");
