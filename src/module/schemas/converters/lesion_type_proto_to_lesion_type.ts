import { injected, token } from "brandi";
import { LesionType } from "../../../dataaccess/db/classification_result";
import { _com_vdsense_polypnet_proto_LesionType_Values } from "../../../proto/gen/com/vdsense/polypnet/proto/LesionType";

export interface LesionTypeProtoToLesionTypeConverter {
    convert(anatomicalSite: _com_vdsense_polypnet_proto_LesionType_Values): LesionType;
}

export class LesionTypeProtoToLesionTypeConverterImpl
    implements LesionTypeProtoToLesionTypeConverter
{
    constructor() {}

    public convert(anatomicalSite: _com_vdsense_polypnet_proto_LesionType_Values): LesionType {
        switch (anatomicalSite) {
            case _com_vdsense_polypnet_proto_LesionType_Values.REFLUX_ESOPHAGITIS:
                return LesionType.REFLUX_ESOPHAGITIS;
            case _com_vdsense_polypnet_proto_LesionType_Values.ESOPHAGEAL_CANCER:
                return LesionType.ESOPHAGEAL_CANCER;
            case _com_vdsense_polypnet_proto_LesionType_Values.GASTRITIS:
                return LesionType.GASTRITIS;
            case _com_vdsense_polypnet_proto_LesionType_Values.STOMACH_CANCER:
                return LesionType.STOMACH_CANCER;
            case _com_vdsense_polypnet_proto_LesionType_Values.DUODENAL_ULCER:
                return LesionType.DUODENAL_ULCER;
            default:
                return LesionType.NON_LESION;
        }
    }
}

injected(LesionTypeProtoToLesionTypeConverterImpl);

export const LESION_TYPE_PROTO_TO_LESION_TYPE_CONVERTER_TOKEN =
    token<LesionTypeProtoToLesionTypeConverter>(
        "LesionTypeProtoToLesionTypeConverter"
    );
