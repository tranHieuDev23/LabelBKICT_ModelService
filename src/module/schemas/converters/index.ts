import { Container } from "brandi";
import {
    AnatomicalSiteProtoToAnatomicalSiteConverterImpl,
    ANATOMICAL_SITE_PROTO_TO_ANATOMICAL_SITE_CONVERTER_TOKEN
} from "./anatomical_site_proto_to_anatomical_site"
import {
    LesionTypeProtoToLesionTypeConverterImpl,
    LESION_TYPE_PROTO_TO_LESION_TYPE_CONVERTER_TOKEN
} from "./lesion_type_proto_to_lesion_type"
import {
    HpStatusProtoToHpStatusConverterImpl,
    HP_STATUS_PROTO_TO_HP_STATUS_CONVERTER_TOKEN
} from "./hp_status_proto_to_hp_status"

export * from "./anatomical_site_proto_to_anatomical_site";
export * from "./lesion_type_proto_to_lesion_type";
export * from "./hp_status_proto_to_hp_status";

export function bindToContainer(container: Container): void {
    container
        .bind(ANATOMICAL_SITE_PROTO_TO_ANATOMICAL_SITE_CONVERTER_TOKEN)
        .toInstance(AnatomicalSiteProtoToAnatomicalSiteConverterImpl)
        .inSingletonScope();
    container
        .bind(LESION_TYPE_PROTO_TO_LESION_TYPE_CONVERTER_TOKEN)
        .toInstance(LesionTypeProtoToLesionTypeConverterImpl)
        .inSingletonScope();
    container
        .bind(HP_STATUS_PROTO_TO_HP_STATUS_CONVERTER_TOKEN)
        .toInstance(HpStatusProtoToHpStatusConverterImpl)
        .inSingletonScope();
}