import { injected, token } from "brandi";
import { HpStatus } from "../../../dataaccess/db/classification_result";
import { _com_vdsense_polypnet_proto_HpStatus_Values } from "../../../proto/gen/com/vdsense/polypnet/proto/HpStatus";

export interface HpStatusProtoToHpStatusConverter {
    convert(hpStatusValue: string): string;
}

export class HpStatusProtoToHpStatusConverterImpl
    implements HpStatusProtoToHpStatusConverter
{
    constructor() {}

    public convert(hpStatusValue: string): string {
        switch (hpStatusValue) {
            case _com_vdsense_polypnet_proto_HpStatus_Values[0]:
                return HpStatus[0];
            case _com_vdsense_polypnet_proto_HpStatus_Values[1]:
                return HpStatus[1];
            default:
                return "";
        }
    }
}

injected(HpStatusProtoToHpStatusConverterImpl);

export const HP_STATUS_PROTO_TO_HP_STATUS_CONVERTER_TOKEN =
    token<HpStatusProtoToHpStatusConverter>(
        "HpStatusProtoToHpStatusConverter"
    );
