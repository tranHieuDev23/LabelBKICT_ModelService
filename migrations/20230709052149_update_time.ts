import { Knex } from "knex";

const TabNameModelServiceDetectionTask = "model_service_detection_task_tab";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable(TabNameModelServiceDetectionTask, (tab) => {
        tab.bigInteger("update_time").notNullable();
        tab.index(["request_time"], "model_service_detection_task_request_time_idx");
        tab.index(["update_time"], "model_service_detection_task_update_time_idx");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable(TabNameModelServiceDetectionTask, (tab) => {
        tab.dropIndex("model_service_detection_task_update_time_idx");
        tab.dropIndex("model_service_detection_task_request_time_idx");
        tab.dropColumn("update_time");
    });
}
