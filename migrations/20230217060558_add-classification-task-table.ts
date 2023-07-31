import { Knex } from "knex";

const TabNameModelServiceClassificationTask = "model_service_classification_task_tab";
const TabNameModelServiceClassificationType = "model_service_classification_type_tab";

export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable(TabNameModelServiceClassificationType))) {
        await knex.schema.createTable(
            TabNameModelServiceClassificationType,
            (tab) => {
                tab.increments("classification_type_id", { primaryKey: true });
                tab.string("display_name", 256).notNullable();
            });
    }

    if (!(await knex.schema.hasTable(TabNameModelServiceClassificationTask))) {
        await knex.schema.createTable(
            TabNameModelServiceClassificationTask,
            (tab) => {
                tab.increments("classification_task_id", { primaryKey: true });
                tab.integer("of_image_id").notNullable();
                tab.integer("of_classification_type_id").notNullable();
                tab.bigInteger("request_time").notNullable();
                tab.smallint("status").notNullable();

                tab.foreign("of_classification_type_id")
                    .references("classification_type_id")
                    .inTable(TabNameModelServiceClassificationType)
                    .onDelete("CASCADE");

                tab.index(
                    ["of_image_id", "of_classification_type_id"],
                    "model_service_classification_task_of_image_id_of_classification_type_id_idx"
                );
            }
        );
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable(TabNameModelServiceClassificationTask);
    await knex.schema.dropTable(TabNameModelServiceClassificationType);
}
