import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import { Logger } from "winston";
import { 
  ClassificationTaskDataAccessor,
  ClassificationTaskStatus,
  CLASSIFICATION_TASK_DATA_ACCESSOR_TOKEN,
  ClassificationTaskListFilterOptions,
  ClassificationTaskListSortOrder,
  ClassificationTask as DMClassificationTask
} from "../../dataaccess/db/classification_task";
import { ClassificationTaskCreated, ClassificationTaskCreatedProducer, CLASSIFICATION_TASK_CREATED_PRODUCER_TOKEN } from "../../dataaccess/kafka/producer/classification_task_created";
import { ClassificationType } from "../../proto/gen/ClassificationType";
import { ErrorWithStatus, LOGGER_TOKEN, Timer, TIMER_TOKEN } from "../../utils";
import { _ClassificationTaskListSortOrder_Values } from "../../proto/gen/ClassificationTaskListSortOrder";
import { _ClassificationTaskStatus_Values } from "../../proto/gen/ClassificationTaskStatus";
import { ClassificationTask } from "../../proto/gen/ClassificationTask";

export interface ClassificationTaskManagementOperator {
  createClassificationTask(
    imageId: number,
    clasificationTypeId: number
  ): Promise<void>;
  createClassificationTaskBatch(
    imageIdList: number[],
    clasificationTypeId: number
  ): Promise<void>;
  getClassificationTaskList(
    offset: number,
    limit: number,
    ofImageIdList: number[],
    ofClassificationTypeIdList: number[],
    statusList: _ClassificationTaskStatus_Values[],
    sortOrder: _ClassificationTaskListSortOrder_Values
  ): Promise<{
    totalClassificationTaskCount: number,
    classificationTaskList: ClassificationTask[];
  }>
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

  public async getClassificationTaskList(
    offset: number,
    limit: number,
    ofImageIdList: number[],
    ofClassificationTypeIdList: number[],
    statusList: _ClassificationTaskStatus_Values[],
    sortOrder: _ClassificationTaskListSortOrder_Values
  ): Promise<{
    totalClassificationTaskCount: number,
    classificationTaskList: ClassificationTask[];
  }> {
    const filterOptions = new ClassificationTaskListFilterOptions();
    filterOptions.ofImageIdList = ofImageIdList;
    filterOptions.ofClassificationTypeIdList = ofClassificationTypeIdList;
    filterOptions.statusList = statusList.map((item) => this.getClassificationTaskStatus(item));
    const [totalClassificationTaskCount, dmClassificationTaskList] = await Promise.all([
      this.classificationTaskDM.countClassificationTask(filterOptions),
      this.classificationTaskDM.getClassificationTaskList(
          offset,
          limit,
          filterOptions,
          this.getDetectionTaskListSortOrder(sortOrder)
      ),
  ]);
  const classificationTaskList = dmClassificationTaskList.map((item) => this.getProtoClassificationTask(item));
  return { totalClassificationTaskCount, classificationTaskList };
  }

  private getClassificationTaskStatus(statusValue: _ClassificationTaskStatus_Values): ClassificationTaskStatus {
    switch (statusValue) {
      case _ClassificationTaskStatus_Values.REQUESTED:
        return ClassificationTaskStatus.REQUESTED;
      case _ClassificationTaskStatus_Values.DONE:
        return ClassificationTaskStatus.DONE;
      default:
        throw new ErrorWithStatus("unknown classification task status", status.INVALID_ARGUMENT);
    }
  }

  private getDetectionTaskListSortOrder(
      sortOrder: _ClassificationTaskListSortOrder_Values
  ): ClassificationTaskListSortOrder {
    switch (sortOrder) {
      case _ClassificationTaskListSortOrder_Values.ID_ASCENDING:
        return ClassificationTaskListSortOrder.ID_ASCENDING;
      case _ClassificationTaskListSortOrder_Values.ID_DESCENDING:
        return ClassificationTaskListSortOrder.ID_DESCENDING;
      case _ClassificationTaskListSortOrder_Values.REQUEST_TIME_ASCENDING:
        return ClassificationTaskListSortOrder.REQUEST_TIME_ASCENDING;
      case _ClassificationTaskListSortOrder_Values.REQUEST_TIME_DESCENDING:
        return ClassificationTaskListSortOrder.REQUEST_TIME_DESCENDING;
      default:
        throw new ErrorWithStatus("unknown classification task list sort order", status.INVALID_ARGUMENT);
    }
  }

  private getProtoClassificationTask(dmClassificationTask: DMClassificationTask): ClassificationTask {
    return {
        id: dmClassificationTask.id,
        ofImageId: dmClassificationTask.ofImageId,
        ofClassificationTypeId: dmClassificationTask.ofClassificationTypeId,
        requestTime: dmClassificationTask.requestTime,
        status: this.getProtoDetectionTaskStatus(dmClassificationTask.status)
    };
}

private getProtoDetectionTaskStatus(statusValue: ClassificationTaskStatus): _ClassificationTaskStatus_Values {
    switch (statusValue) {
        case ClassificationTaskStatus.REQUESTED:
            return _ClassificationTaskStatus_Values.REQUESTED;
        case ClassificationTaskStatus.DONE:
            return _ClassificationTaskStatus_Values.DONE;
        default:
            throw new ErrorWithStatus("unknown classification task status", status.INTERNAL);
    }
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
