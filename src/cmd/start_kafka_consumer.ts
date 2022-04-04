import { Container } from "brandi";
import dotenv from "dotenv";
import * as utils from "../utils";
import * as config from "../config";
import * as grpc from "../dataaccess/grpc";
import * as db from "../dataaccess/db";
import * as kafka from "../dataaccess/kafka";
import * as modules from "../module";
import * as consumer from "../consumer";

export function startKafkaConsumer(dotenvPath: string) {
    dotenv.config({
        path: dotenvPath,
    });

    const container = new Container();
    utils.bindToContainer(container);
    config.bindToContainer(container);
    grpc.bindToContainer(container);
    db.bindToContainer(container);
    kafka.bindToContainer(container);
    modules.bindToContainer(container);
    consumer.bindToContainer(container);

    const kafkaConsumer = container.get(
        consumer.MODEL_SERVICE_KAFKA_CONSUMER_TOKEN
    );

    kafkaConsumer.start();
}