import { Knex } from "knex";

const TabNameModelServiceClassificationTask = "model_service_classification_task_tab";

export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable(TabNameModelServiceClassificationTask))) {
        await knex.schema.createTable(
            TabNameModelServiceClassificationTask,
            (tab) => {
                tab.increments("classification_task_id", { primaryKey: true });
                tab.integer("of_image_id").notNullable();
                tab.bigInteger("request_time").notNullable();
                tab.smallint("status").notNullable();

                tab.index(
                    ["of_image_id", "status"],
                    "model_service_classification_task_of_image_id_status_idx"
                );
            }
        );
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable(TabNameModelServiceClassificationTask);
}
