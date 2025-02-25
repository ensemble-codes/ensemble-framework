export let IPFS_SCHEME = "ipfs://";

export let HTTP_SCHEME = "https://";

export let BASE_IPFS_URL = "https://ipfs.io/ipfs/";

export function getContentPath(tokenURI: string): string {
    if (tokenURI.startsWith(HTTP_SCHEME) && tokenURI.length > HTTP_SCHEME.length) {
      return tokenURI.split(BASE_IPFS_URL).join("")
    } else if (tokenURI.startsWith(IPFS_SCHEME) && tokenURI.length > IPFS_SCHEME.length) {
      return tokenURI.split(IPFS_SCHEME).join("")
    } else {
      return ""
    }
}