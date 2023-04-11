const { BATCH_SIZE } = require("./helper/Constants");
const { promiseAllInBatches } = require("./helper/PromiseHelper");
const { extractRRNFromDbResponse, extractIdFromRRN } = require("./helper/RRNHelper");


module.exports = {
  generateSEOPages: async () => {

    const rrnCollection = await collectRRNsFromDb();
    const assetCollection = await collectAssetsFromDeezer(rrnCollection);
    const createPagePromises = createPages(assetCollection);

    await Promise.all(createPagePromises)
  }
}


const createPages = (assetCollection) => {
  const toCreatePagesCount = assetCollection.albums.length + assetCollection.playlists.length + assetCollection.artists.length
  strapi.log.info(`Trying to creating ${toCreatePagesCount} new pages`)

  const playlistPagePromises = promiseAllInBatches(createPlaylistPage, assetCollection.playlists, BATCH_SIZE.database);
  const artistPagePromises = promiseAllInBatches(createArtistPage, assetCollection.artists, BATCH_SIZE.database);
  const albumPagePromises = promiseAllInBatches(createAlbumPage, assetCollection.albums, BATCH_SIZE.database);

  return [playlistPagePromises, artistPagePromises, albumPagePromises].flat();
}

const collectAssetsFromDeezer = async (rrnCollection) => {
  const playlistResponses = await promiseAllInBatches((...args) => strapi.deezerProxy.getPlaylistForRRN(...args), rrnCollection.playlists, BATCH_SIZE.deezerRequest);
  const artistResponses = await promiseAllInBatches((...args) => strapi.deezerProxy.getArtistForRRN(...args), rrnCollection.artists, BATCH_SIZE.deezerRequest);
  const albumResponses = await promiseAllInBatches((...args) => strapi.deezerProxy.getAlbumForRRN(...args), rrnCollection.albums, BATCH_SIZE.deezerRequest);

  const playlists = playlistResponses.filter(playlist => playlist);
  const artists = artistResponses.filter(artist => artist);
  const albums = albumResponses.filter(album => album);

  return { playlists, artists, albums };
}

const collectRRNsFromDb = async () => {
  const playlistQuery = `SELECT DISTINCT rrn FROM components_cms_editorial_teasers WHERE rrn LIKE 'rrn:music:deezer:playlist%' AND SUBSTRING_INDEX(rrn, ':', -1) NOT IN (SELECT SUBSTRING_INDEX(url, '-', -1) FROM pages WHERE url LIKE '%playlist%');`
  const artistQuery = `SELECT DISTINCT rrn FROM components_cms_editorial_teasers WHERE rrn LIKE 'rrn:music:deezer:artist%' AND SUBSTRING_INDEX(rrn, ':', -1) NOT IN (SELECT SUBSTRING_INDEX(url, '-', -1) FROM pages WHERE url LIKE '%artist%')`
  const albumQuery = `SELECT DISTINCT rrn FROM components_cms_editorial_teasers WHERE rrn LIKE 'rrn:music:deezer:album%' AND SUBSTRING_INDEX(rrn, ':', -1) NOT IN (SELECT SUBSTRING_INDEX(url, '-',-1) FROM pages WHERE url LIKE '%album%')`

  const playlists = await queryAndFilterFromDb(playlistQuery);
  const artists = await queryAndFilterFromDb(artistQuery);
  const albums = await queryAndFilterFromDb(albumQuery);

  return { playlists, artists, albums }
}

const queryAndFilterFromDb = async (query) => {
  const dbResults = await strapi.db.connection.context.raw(query);
  return extractRRNFromDbResponse(dbResults, 'rrn');
}

const createPlaylistPage = async (playlist) => {
  try {
    const playlistId = extractIdFromRRN(playlist.id);
    const playlistUrl = `/musik/playlist-${playlistId}`
    const playlistTitle = playlist.title;
    const playlistTags = playlist.title;
    return await createPage(playlistTitle, playlistUrl, playlistTags)
  } catch (e) {
    resolveError(e, playlist.id);
  }
}

const createArtistPage = async (artist) => {
  try {
    const artistId = extractIdFromRRN(artist.id);
    const artistUrl = `/musik/artist-${artistId}`
    const artistTitle = artist.name;
    const artistTags = artist.name;
    return await createPage(artistTitle, artistUrl, artistTags)
  } catch (e) {
    resolveError(e, artist.id);
  }
}

const createAlbumPage = async (album) => {
  try {
    const albumId = extractIdFromRRN(album.id);
    const artistId = extractIdFromRRN(album.artist.id);
    const albumUrl = `/musik/artist-${artistId}/album-${albumId}`
    const albumTitle = album.title;
    const albumTags = `${album.artist.name}, ${album.title}`
    return await createPage(albumTitle, albumUrl, albumTags)
  } catch (e) {
    resolveError(e, album.id);
  }
}

const createPage = (assetTitle, assetUrl, metaTags) => {
  validateTitle(assetTitle);

  const assetPage = buildPageObject(assetUrl, assetTitle, metaTags);

  return createPageInDB(assetPage);
}

const createPageInDB = (page) => {
  return strapi.entityService.create('api::page.page', {data: page});
}

const buildPageObject = (url, title, metaTags) => {
  return {
    url: url,
    title: title,
    metaRobotFollow: true,
    metaRobotIndex: true,
    metaTags: metaTags,
    publishedAt: new Date(),
    teaserrows: [],
  }
}

const validateTitle = (title) => {
  if (!title) {
    throw new Error(`Title is undefined or null!`)
  } else if (title.length < 1) {
    throw new Error(`Title is too short! Title "${title}" length is ${title.length}, should be at least 1!`)
  }
}

const resolveError = (error, rrn) => {
  strapi.log.error(`An error accorded for asset ${rrn}. Error message: ${error.message}`)
}
