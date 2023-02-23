import { Container } from "brandi";
import * as detect from "./detect";
import * as detectionTaskManagement from "./detection_task_management";
import * as classify from "./classify";
import * as classificationTaskManagement from "./classification_task_management";

export function bindToContainer(container: Container): void {
    detect.bindToContainer(container);
    detectionTaskManagement.bindToContainer(container);
    classify.bindToContainer(container);
    classificationTaskManagement.bindToContainer(container);
}
