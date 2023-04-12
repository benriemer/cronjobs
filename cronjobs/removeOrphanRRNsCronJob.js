const {promiseAllInBatches} = require("./helper/PromiseHelper");
const {checkIfRRNIsValid, extractIdFromRRN} = require("./helper/RRNHelper");
const {ASSET_KEY, BATCH_SIZE, REDIS, MY_SQL} = require("./helper/Constants");


module.exports = {
  startRemoveOrphans: async (strapi) => {
    await strapi.cacheService.connectToClient();

    await removeOrphans()

    await strapi.cacheService.closeClient();
  }
}



const removeOrphans = async () => {
  const orphanRNNs = await collectOrphanRRNs();
  const orphanUrls = buildOrphanUrlsFromRRNs(orphanRNNs);
  await deleteOrphans(orphanRNNs, orphanUrls);
}

const collectOrphanRRNs = async () => {
  const potentialOrphanRRNs = (await strapi.cacheService.readFromCache(REDIS.key)) || [];
  const requestResults = await promiseAllInBatches(checkIfRRNIsValid, potentialOrphanRRNs, BATCH_SIZE.deezerRequest);
  return requestResults.filter(result => result);
}

const buildOrphanUrlsFromRRNs = (rrns) => {
  const orphanArtists = rrns.filter(rrn => rrn.includes(ASSET_KEY.artist));
  const orphanAlbums = rrns.filter(rrn => rrn.includes(ASSET_KEY.album));
  const orphanPlaylist = rrns.filter(rrn => rrn.includes(ASSET_KEY.playlist));

  const artistUrls = orphanArtists.map(buildArtistUrl);
  const playlistUrls = orphanPlaylist.map(buildPlaylistUrl)
  const albumUrls = orphanAlbums.map(buildAlbumUrl);
  return [artistUrls, playlistUrls, albumUrls].flat();
}

const buildArtistUrl = (rrn) => {
  const artistId = extractIdFromRRN(rrn);
  return `/musik/artist-${artistId}`
}

const buildPlaylistUrl = (rrn) => {
  const playlistId = extractIdFromRRN(rrn);
  return `/musik/playlist-${playlistId}`
}

const buildAlbumUrl = (rrn) => {
  const albumId = extractIdFromRRN(rrn);
  return `/musik/artist-%/album-${albumId}`
}

const deleteOrphans = async (rrns, urls) => {
  await promiseAllInBatches(deleteOrphanTeasersFromDb, rrns, BATCH_SIZE.database);
  await promiseAllInBatches(deleteOrphanPagesFromDb, urls, BATCH_SIZE.database);
}

const deleteOrphanTeasersFromDb = async (rrn) => {
  const deleteQuery = `DELETE FROM components_cms_editorial_teasers WHERE rrn = '${rrn}'`
  await handleQuery(deleteQuery, rrn);
}

const deleteOrphanPagesFromDb = async (url) => {
  let deleteQuery = (url.includes(ASSET_KEY.album) && url.includes(MY_SQL.wildCard))
    ? `DELETE FROM pages where url LIKE '${url}'`
    : `DELETE FROM pages where url = '${url}'`;

  await handleQuery(deleteQuery, url);
}

const handleQuery = async (query, asset) => {
  try {
    await strapi.db.connection.context.raw(query);
  } catch (e) {
    resolveError(e.message, asset)
  }
}

const resolveError = (error, rrn) => {
  strapi.log.error(`An error accorded for asset ${rrn}. Error message: ${error}`)
}
