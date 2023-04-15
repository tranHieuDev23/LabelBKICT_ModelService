import { injected, token } from "brandi";
import { AnatomicalSite } from "../../../dataaccess/db/classification_result";
import { _com_vdsense_polypnet_proto_AnatomicalSite_Values } from "../../../proto/gen/com/vdsense/polypnet/proto/AnatomicalSite";

export interface AnatomicalSiteProtoToAnatomicalSiteConverter {
    convert(anatomicalSite: _com_vdsense_polypnet_proto_AnatomicalSite_Values): AnatomicalSite;
}

export class AnatomicalSiteProtoToAnatomicalSiteConverterImpl
    implements AnatomicalSiteProtoToAnatomicalSiteConverter
{
    constructor() {}

    public convert(anatomicalSite: _com_vdsense_polypnet_proto_AnatomicalSite_Values): AnatomicalSite {
        switch (anatomicalSite) {
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values.PHARYNX:
                return AnatomicalSite.PHARYNX;
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values.ESOPHAGUS:
                return AnatomicalSite.ESOPHAGUS;
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values.CARDIA:
                return AnatomicalSite.CARDIA;
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values.GASTRIC_BODY:
                return AnatomicalSite.GASTRIC_BODY;
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values.GASTRIC_FUNDUS:
                return AnatomicalSite.GASTRIC_FUNDUS;
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values.GASTRIC_ANTRUM:
                return AnatomicalSite.GASTRIC_ANTRUM;
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values.GREATER_CURVATURE:
                return AnatomicalSite.GREATER_CURVATURE;
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values.LESSER_CURVATURE:
                return AnatomicalSite.LESSER_CURVATURE;
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values.DUODENUM_BULB:
                return AnatomicalSite.DUODENUM_BULB;
            case _com_vdsense_polypnet_proto_AnatomicalSite_Values.DUODENUM:
                return AnatomicalSite.DUODENUM;
            default:
                return AnatomicalSite.UNQUALIFIER;
        }
    }
}

injected(AnatomicalSiteProtoToAnatomicalSiteConverterImpl);

export const ANATOMICAL_SITE_PROTO_TO_ANATOMICAL_SITE_CONVERTER_TOKEN =
    token<AnatomicalSiteProtoToAnatomicalSiteConverter>(
        "AnatomicalSiteProtoToAnatomicalSiteConverter"
    );
