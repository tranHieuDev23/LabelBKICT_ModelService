import minimist from "minimist";
import { startGRPCServer } from "./cmd/start_grpc_server";
import { startKafkaConsumer } from "./cmd/start_kafka_consumer";
import { updateProcessingDetectionTaskToRequested } from "./cmd/update_processing_detection_task_to_requested";
import { processRequestedDetectionTasks } from "./cmd/process_requested_detection_task";

const args = minimist(process.argv);
if (args["start_grpc_server"]) {
    startGRPCServer(".env");
} else if (args["start_kafka_consumer"]) {
    startKafkaConsumer(".env");
} else if (args["update_processing_detection_task_to_requested"]) {
    updateProcessingDetectionTaskToRequested(".env");
} else if (args["process_requested_detection_task"]) {
    processRequestedDetectionTasks(".env");
} else {
    console.log("no component was selected, exiting...");
}
