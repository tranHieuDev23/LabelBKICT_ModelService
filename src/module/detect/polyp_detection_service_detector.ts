import { Logger } from "winston";
import sharp from "sharp";
import { ApplicationConfig, APPLICATION_CONFIG_TOKEN } from "../../config";
import { PolypDetectionServiceClient } from "../../proto/gen/com/vdsense/polypnet/proto/PolypDetectionService";
import { Image } from "../../proto/gen/Image";
import { Polygon } from "../../proto/gen/Polygon";
import { PolypDetectionResponse } from "../../proto/gen/com/vdsense/polypnet/proto/PolypDetectionResponse";
import { PolypDetectionRequest } from "../../proto/gen/com/vdsense/polypnet/proto/PolypDetectionRequest";
import { LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";
import { ImageType } from "../../proto/gen/ImageType";
import { Vertex } from "../../proto/gen/Vertex";
import { injected, token } from "brandi";
import { ESOPHAGUS_DETECTION_SERVICE_DM_TOKEN, POLYP_DETECTION_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { BucketDM, ORIGINAL_IMAGE_S3_DM_TOKEN } from "../../dataaccess/s3";

export interface PolypDetectionServiceDetector {
    detectRegionListFromImage(image: Image): Promise<Polygon[]>;
}

export class PolypDetectionServiceDetectorImpl implements PolypDetectionServiceDetector {
    private readonly imageTypeIdToServiceDM: Map<number, PolypDetectionServiceClient>;

    constructor(
        polypDetectionServiceDM: PolypDetectionServiceClient,
        esophagusDetectionServiceDM: PolypDetectionServiceClient,
        applicationConfig: ApplicationConfig,
        private readonly originalImageS3DM: BucketDM,
        private readonly logger: Logger
    ) {
        this.imageTypeIdToServiceDM = new Map();
        for (const imageTypeId of applicationConfig.imageTypeIdListForPolypDetectionService) {
            this.imageTypeIdToServiceDM.set(imageTypeId, polypDetectionServiceDM);
        }
        for (const imageTypeId of applicationConfig.imageTypeIdListForEsophagusDetectionService) {
            this.imageTypeIdToServiceDM.set(imageTypeId, esophagusDetectionServiceDM);
        }
    }

    public async detectRegionListFromImage(image: Image): Promise<Polygon[]> {
        const polypDetectionServiceDM = this.getPolypDetectionServiceDMForImageType(image.imageType);
        if (!polypDetectionServiceDM) {
            this.logger.error("no polyp detection service corresponding to the image type, will skip");
            return [];
        }
        if (image.originalImageFilename === undefined) {
            this.logger.error("image does not have original image file name", {
                imageId: image.id,
            });
            throw new Error("image does not have original image file name");
        }
        const imageData = await this.originalImageS3DM.getFile(image.originalImageFilename);
        const polypDetectResponse = await this.getPolypDetectResponse(imageData, polypDetectionServiceDM);
        const imageSharp = sharp(imageData);
        return await this.getRegionListFromPolypDetectResponse(polypDetectResponse, imageSharp);
    }

    private getPolypDetectionServiceDMForImageType(
        imageType: ImageType | null | undefined
    ): PolypDetectionServiceClient | null {
        if (!imageType) {
            return null;
        }
        const polypDetectionServiceDM = this.imageTypeIdToServiceDM.get(imageType.id || 0);
        if (polypDetectionServiceDM === undefined) {
            return null;
        }
        return polypDetectionServiceDM;
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

    private async getRegionListFromPolypDetectResponse(
        polypDetectResponse: PolypDetectionResponse,
        imageSharp: sharp.Sharp
    ): Promise<Polygon[]> {
        const imageMetadata = await imageSharp.metadata();
        const imageWidth = imageMetadata.width || 0;
        const imageHeight = imageMetadata.height || 0;
        const regionList: Polygon[] = [];
        for (const polyp of polypDetectResponse.polyps || []) {
            const vertices: Vertex[] = [];
            for (const point of polyp.boundingPoly || []) {
                vertices.push({
                    x: (point.x || 0) / imageWidth,
                    y: (point.y || 0) / imageHeight,
                });
            }
            regionList.push({ vertices });
        }
        return regionList;
    }
}

injected(
    PolypDetectionServiceDetectorImpl,
    POLYP_DETECTION_SERVICE_DM_TOKEN,
    ESOPHAGUS_DETECTION_SERVICE_DM_TOKEN,
    APPLICATION_CONFIG_TOKEN,
    ORIGINAL_IMAGE_S3_DM_TOKEN,
    LOGGER_TOKEN
);

export const POLYP_DETECTION_SERVICE_DETECTOR_TOKEN = token<PolypDetectionServiceDetector>(
    "PolypDetectionServiceDetector"
);
