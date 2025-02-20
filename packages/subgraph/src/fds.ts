import { Bytes, dataSource, json, JSONValue, JSONValueKind, TypedMap } from "@graphprotocol/graph-ts";
import { IpfsMetadata } from "../generated/schema";

export function handleAgentMetadata(content: Bytes): void {
    let metadataId = dataSource.stringParam()
    let ipfsData = IpfsMetadata.load(metadataId)

    if (ipfsData) {
        return
    }

    ipfsData = new IpfsMetadata(metadataId)

    if (content.length == 0) {
        saveDefaultMetadata(ipfsData)
        return
    }

    let jsonResult = json.try_fromBytes(content)
    if (jsonResult.isError) {
        saveDefaultMetadata(ipfsData)
        return
    }

    let value = jsonResult.value.toObject()
    if (!value) {
        saveDefaultMetadata(ipfsData)
        return
    }

    ipfsData.name = extractStringField(value, "name")
    ipfsData.description = extractStringField(value, "description")
    ipfsData.imageUri = extractStringField(value, "imageURI")

    let socials = value.get("socials")
    if (!socials) {
        ipfsData.save()
        return
    }

    let socialsObj = socials.toObject()
    ipfsData.telegram = extractStringField(socialsObj, "telegram")
    ipfsData.twitter = extractStringField(socialsObj, "twitter")
    ipfsData.github = extractStringField(socialsObj, "github")
    ipfsData.dexscreener = extractStringField(socialsObj, "dexscreener")

    ipfsData.save();
}

function extractStringField(obj: TypedMap<string, JSONValue>, field: string): string {
    let value = obj.get(field)
    return value && value.kind == JSONValueKind.STRING ? value.toString() : ""
  }

function saveDefaultMetadata(ipfsData: IpfsMetadata): void {
    ipfsData.name = ""
    ipfsData.description = ""
    ipfsData.imageUri = ""
    ipfsData.telegram = ""
    ipfsData.twitter = ""
    ipfsData.github = ""
    ipfsData.dexscreener = ""
    ipfsData.save()
}
