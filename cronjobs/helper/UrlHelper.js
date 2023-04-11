const {ASSET_KEY} = require("./Constants");

const getIdFromUrl = (url) => {
  return url.substring(url.lastIndexOf('-') + 1, url.length);
}

const buildRRNFromUrl = (url) => {
  const id = getIdFromUrl(url);
  if (url.includes(ASSET_KEY.playlist)) {
    return `rrn:music:deezer:${ASSET_KEY.playlist}:${id}`
  }

  if (url.includes(ASSET_KEY.album)) {
    return `rrn:music:deezer:${ASSET_KEY.album}:${id}`
  }

  if (url.includes(ASSET_KEY.artist)) {
    return `rrn:music:deezer:${ASSET_KEY.artist}:${id}`
  }
}

module.exports = {
  getIdFromUrl,
  buildRRNFromUrl
}

