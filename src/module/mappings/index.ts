import { Container } from "brandi";
import {
    AnatomicalSiteValueToImageTagMappingImpl,
    ANATOMICAL_SITE_VALUE_TO_IMAGE_TAG_MAPPING_TOKEN
} from "./anatomical_site_value_to_image_tag"

export * from "./anatomical_site_value_to_image_tag";

export function bindToContainer(container: Container) {
    container
        .bind(ANATOMICAL_SITE_VALUE_TO_IMAGE_TAG_MAPPING_TOKEN)
        .toInstance(AnatomicalSiteValueToImageTagMappingImpl)
        .inSingletonScope();
}