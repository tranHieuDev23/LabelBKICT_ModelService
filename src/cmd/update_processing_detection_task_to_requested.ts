import { Container } from "brandi";
import dotenv from "dotenv";
import * as utils from "../utils";
import * as config from "../config";
import * as grpc from "../dataaccess/grpc";
import * as db from "../dataaccess/db";
import * as kafka from "../dataaccess/kafka";
import * as s3 from "../dataaccess/s3";
import * as modules from "../module";
import * as jobs from "../jobs";

export function updateProcessingDetectionTaskToRequested(dotenvPath: string) {
    dotenv.config({
        path: dotenvPath,
    });

    const container = new Container();
    utils.bindToContainer(container);
    config.bindToContainer(container);
    grpc.bindToContainer(container);
    db.bindToContainer(container);
    kafka.bindToContainer(container);
    s3.bindToContainer(container);
    modules.bindToContainer(container);
    jobs.bindToContainer(container);

    const job = container.get(jobs.UPDATE_PROCESSING_DETECTION_TASK_TO_REQUESTED_TOKEN);
    job.execute().then(() => {
        process.exit();
    });
}
