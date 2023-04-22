import { injected, token } from "brandi";
import { AnatomicalSite } from "../../../dataaccess/db/classification_result";
import { _com_vdsense_polypnet_proto_AnatomicalSite_Values } from "../../../proto/gen/com/vdsense/polypnet/proto/AnatomicalSite";

export interface AnatomicalSiteProtoToAnatomicalSiteConverter {
    convert(anatomicalSiteValue: string): string;
}

export class AnatomicalSiteProtoToAnatomicalSiteConverterImpl
    implements AnatomicalSiteProtoToAnatomicalSiteConverter
{
    constructor() {}

    public convert(anatomicalSiteValue: string): string {
        switch (anatomicalSiteValue) {
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values[0]:
                return AnatomicalSite[0];
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values[1]:
                return AnatomicalSite[1];
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values[2]:
                return AnatomicalSite[2];
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values[3]:
                return AnatomicalSite[3];
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values[4]:
                return AnatomicalSite[4];
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values[5]:
                return AnatomicalSite[5];
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values[6]:
                return AnatomicalSite[6];
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values[7]:
                return AnatomicalSite[7];
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values[8]:
                return AnatomicalSite[8];
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values[9]:
                return AnatomicalSite[9];
            default:
                return AnatomicalSite[10];
        }
    }
}

injected(AnatomicalSiteProtoToAnatomicalSiteConverterImpl);

export const ANATOMICAL_SITE_PROTO_TO_ANATOMICAL_SITE_CONVERTER_TOKEN =
    token<AnatomicalSiteProtoToAnatomicalSiteConverter>(
        "AnatomicalSiteProtoToAnatomicalSiteConverter"
    );
