const { BATCH_SIZE, REDIS } = require("./helper/Constants");
const { buildRRNFromUrl } = require("./helper/UrlHelper");
const { checkIfRRNIsValid, extractRRNFromDbResponse } = require("./helper/RRNHelper");
const { promiseAllInBatches } = require("./helper/PromiseHelper");

module.exports = {
  collectOrphans: async (strapi) => {

    await strapi.cacheService.connectToClient();

    await handleOrphanRRNS();

    await strapi.cacheService.closeClient();
  }
}

const handleOrphanRRNS = async () => {
  const dbRRNs = await collectRRNFromDb();
  const potentialOrphansRRNs = await checkForOrphanRRNs(dbRRNs);
  await strapi.cacheService.writeToCache(REDIS.key, potentialOrphansRRNs);
}

const collectRRNFromDb = async () => {
  const dbResults = await queryRRNsFromDb();

  const pageUrls = extractRRNFromDbResponse(dbResults.pages, 'url');
  const teaserRRNs = extractRRNFromDbResponse(dbResults.teasers, 'rrn');

  const pageRRNs = pageUrls.map(buildRRNFromUrl).filter(rrn => rrn);
  return [...teaserRRNs, ...pageRRNs];
}

const queryRRNsFromDb = async () => {
  const teaserResults = await queryTeaserRRNsFromDb();
  const pageResults = await queryPageUrlsFromDb();

  return { teasers: teaserResults, pages: pageResults };
}

const queryTeaserRRNsFromDb = async () => {
  const teaserQuery = `SELECT DISTINCT rrn FROM components_cms_editorial_teasers;`
  return await strapi.db.connection.context.raw(teaserQuery);
}

const queryPageUrlsFromDb = async () => {
  const pageQuery = `SELECT DISTINCT url FROM pages;`
  return await strapi.db.connection.context.raw(pageQuery);
}


const checkForOrphanRRNs = async (rrns) => {
  const requestResults = await promiseAllInBatches(checkIfRRNIsValid, rrns, BATCH_SIZE.deezerRequest);
  return requestResults.filter(result => result);
}


