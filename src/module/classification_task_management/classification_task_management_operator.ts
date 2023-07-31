import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import { Logger } from "winston";
import { ClassificationTaskDataAccessor, ClassificationTaskStatus, CLASSIFICATION_TASK_DATA_ACCESSOR_TOKEN } from "../../dataaccess/db/classification_task";
import { ClassificationTaskCreated, ClassificationTaskCreatedProducer, CLASSIFICATION_TASK_CREATED_PRODUCER_TOKEN } from "../../dataaccess/kafka/producer/classification_task_created";
import { ClassificationType } from "../../proto/gen/ClassificationType";
import { ErrorWithStatus, LOGGER_TOKEN, Timer, TIMER_TOKEN } from "../../utils";

export interface ClassificationTaskManagementOperator {
  createClassificationTask(
    imageId: number,
    clasificationTypeId: number
  ): Promise<void>;
  createClassificationTaskBatch(
    imageIdList: number[],
    clasificationTypeId: number
  ): Promise<void>;
}

export class ClassificationTaskManagementOperatorImpl implements ClassificationTaskManagementOperator {
  constructor(
    private readonly classificationTaskDM: ClassificationTaskDataAccessor,
    private readonly classificationTaskCreatedProducer: ClassificationTaskCreatedProducer,
    private readonly timer: Timer,
    private readonly logger: Logger
  ) {}

  public async createClassificationTask(
    imageId: number,
    clasificationTypeId: number
  ): Promise<void> {
    const requestTime = this.timer.getCurrentTime();
    const requestedTaskCount =
        await this.classificationTaskDM.getRequestedClassificationTaskCountOfImageId(
            imageId
        );
    if (requestedTaskCount > 0) {
        this.logger.error(
            "there are existing requested detection task for image",
            { imageId }
        );
        throw new ErrorWithStatus(
            `there are existing requested detection task for image with image_id ${imageId}`,
            status.ALREADY_EXISTS
        );
    }
    const taskID = await this.classificationTaskDM.createClassificationTask(
        imageId,
        clasificationTypeId,
        requestTime,
        ClassificationTaskStatus.REQUESTED
    );
    await this.classificationTaskCreatedProducer.createClassificationTaskCreatedMessage(
        new ClassificationTaskCreated(taskID, clasificationTypeId)
    );
  }

  public async createClassificationTaskBatch(
    imageIdList: number[],
    clasificationTypeId: number
  ): Promise<void> {
      await Promise.all(
        imageIdList.map((imageId) => this.createClassificationTask(imageId, clasificationTypeId))
      );
  }
}

injected(
  ClassificationTaskManagementOperatorImpl,
  CLASSIFICATION_TASK_DATA_ACCESSOR_TOKEN,
  CLASSIFICATION_TASK_CREATED_PRODUCER_TOKEN,
  TIMER_TOKEN,
  LOGGER_TOKEN
);

export const CLASSIFICATION_TASK_MANAGEMENT_OPERATOR_TOKEN =
  token<ClassificationTaskManagementOperator>("ClassificationTaskManagementOperator");
