import { Knex } from "knex";

const TabNameModelServiceClassificationResult = "model_service_classification_result_tab";

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(TabNameModelServiceClassificationResult))) {
    await knex.schema.createTable(
      TabNameModelServiceClassificationResult,
      (tab) => {
        tab.increments("classification_result_id", { primaryKey: true });
        tab.integer("of_image_id").notNullable();
        tab.smallint("anatomical_site_type").notNullable();
        tab.smallint("lesion_type").notNullable();
        tab.smallint("hp_status");
        tab.bigInteger("request_time").notNullable();

        tab.index(
          ["of_image_id"],
          "model_service_classification_result_of_image_id_idx",
        );
      }
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(TabNameModelServiceClassificationResult);
}