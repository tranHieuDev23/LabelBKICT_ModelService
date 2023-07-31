import { injected, token } from "brandi";
import { Knex } from "knex";
import { Logger } from "winston";
import { status } from "@grpc/grpc-js";
import { ErrorWithStatus, LOGGER_TOKEN } from "../../utils";
import { KNEX_INSTANCE_TOKEN } from "./knex";

export enum AnatomicalSite {
  PHARYNX = 0,
  ESOPHAGUS = 1,
  CARDIA = 2,
  GASTRIC_BODY = 3,
  GASTRIC_FUNDUS = 4,
  GASTRIC_ANTRUM = 5,
  GREATER_CURVATURE = 6,
  LESSER_CURVATURE = 7,
  DUODENUM_BULB = 8,
  DUODENUM = 9,
}

export enum LesionType {
  NON_LESION = 0,
  ESOPHAGEAL_CANCER = 1,
  REFLUX_ESOPHAGITIS = 2,
  DUODENAL_ULCER = 3,
  STOMACH_CANCER = 4,
  GASTRITIS = 5,
}

export enum HpStatus {
  NEGATIVE = 0,
  POSITIVE = 1,
}

export class ClassificationResult {
  constructor(
    public id: number,
    public ofImageId: number,
    public anatomicalSite: AnatomicalSite,
    public lesionType: LesionType,
    public hpStatus: boolean,
  ) {}
}

export interface ClassificationResultDataAccessor {
  createClassificationResult(
    ofImageId: number,
    anatomicalSite: AnatomicalSite,
    lesionType: LesionType,
    hpStatus: boolean | undefined,
    requestTime: number,
  ): Promise<number>;
}

const TabNameModelServiceClassificationResult = "model_service_classification_result_tab";
const ColNameModelServiceClassificationResultClassificationResultId = "classification_result_id";
const ColNameModelServiceClassificationResultOfImageId = "of_image_id";
const ColNameModelServiceClassificationResultAnatomicalSiteType = "anatomical_site_type";
const ColNameModelServiceClassificationResultLesionType = "lesion_type";
const ColNameModelServiceClassificationResultHpStatus = "hp_status";
const ColNameModelServiceClassificationResultRequestTime = "request_time";

export class ClassificationResultDataAccessorImpl implements ClassificationResultDataAccessor {
  constructor(
    private readonly knex: Knex<any, any[]>,
    private readonly logger: Logger
  ) {}

  public async createClassificationResult(
    ofImageId: number,
    anatomicalSite: AnatomicalSite,
    lesionType: LesionType,
    hpStatus: boolean | undefined,
    requestTime: number,
  ): Promise<number> {
    try {
      const rows = await this.knex
        .insert({
          [ColNameModelServiceClassificationResultOfImageId]: ofImageId,
          [ColNameModelServiceClassificationResultAnatomicalSiteType]: anatomicalSite,
          [ColNameModelServiceClassificationResultLesionType]: lesionType,
          [ColNameModelServiceClassificationResultHpStatus]: hpStatus,
          [ColNameModelServiceClassificationResultRequestTime]: requestTime
        })
        .returning([ColNameModelServiceClassificationResultClassificationResultId])
        .into(TabNameModelServiceClassificationResult);
      return +rows[0][ColNameModelServiceClassificationResultClassificationResultId];
    } catch (error) {
      this.logger.error("failed to create classification result", { error });
      throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
    }
  }
}

injected(ClassificationResultDataAccessorImpl, KNEX_INSTANCE_TOKEN, LOGGER_TOKEN);

export const CLASSIFICATION_RESULT_DATA_ACCESSOR_TOKEN =
    token<ClassificationResultDataAccessor>("ClassificationResultDataAccessor");