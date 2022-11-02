import { Knex } from "knex";

const TabNameModelServiceDetectionTask = "model_service_detection_task_tab";

export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable(TabNameModelServiceDetectionTask))) {
        await knex.schema.createTable(
            TabNameModelServiceDetectionTask,
            (tab) => {
                tab.increments("detection_task_id", { primaryKey: true });
                tab.integer("of_image_id").notNullable();
                tab.bigInteger("request_time").notNullable();
                tab.smallint("status").notNullable();

                tab.index(
                    ["of_image_id", "status"],
                    "model_service_detection_task_of_image_id_status_idx"
                );
            }
        );
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable(TabNameModelServiceDetectionTask);
}
