import { injected, token } from "brandi";
import { LesionType } from "../../../dataaccess/db/classification_result";
import { _com_vdsense_polypnet_proto_LesionType_Values } from "../../../proto/gen/com/vdsense/polypnet/proto/LesionType";

export interface LesionTypeProtoToLesionTypeConverter {
    convert(lesionTypeValue: string): string;
}

export class LesionTypeProtoToLesionTypeConverterImpl
    implements LesionTypeProtoToLesionTypeConverter
{
    constructor() {}

    public convert(lesionTypeValue: string): string {
        switch (lesionTypeValue) {
            case _com_vdsense_polypnet_proto_LesionType_Values[0]:
                return LesionType[0];
            case _com_vdsense_polypnet_proto_LesionType_Values[1]:
                return LesionType[1];
            case _com_vdsense_polypnet_proto_LesionType_Values[3]:
                return LesionType[3];
            case _com_vdsense_polypnet_proto_LesionType_Values[4]:
                return LesionType[4];
            case _com_vdsense_polypnet_proto_LesionType_Values[5]:
                return LesionType[5];
            default:
                return "";
        }
    }
}

injected(LesionTypeProtoToLesionTypeConverterImpl);

export const LESION_TYPE_PROTO_TO_LESION_TYPE_CONVERTER_TOKEN =
    token<LesionTypeProtoToLesionTypeConverter>(
        "LesionTypeProtoToLesionTypeConverter"
    );
