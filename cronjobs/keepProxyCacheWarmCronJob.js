const axios = require('axios');
const lodash = require('lodash');
const axiosThrottle = require('axios-request-throttle');

module.exports = {
  keepCacheWarm: async (strapi, options) => {
    const rrnList = await strapi.db.connection.select('rrn').groupBy('rrn').from('components_cms_editorial_teasers');
    axiosThrottle.use(axios, {requestsPerSecond: options.throttle});
    const rrnBatches = lodash.chunk(rrnList.map(row=>row.rrn), options.batchSize);
    for (const rrnBatch of rrnBatches) {
      await runRequestForBatch(rrnBatch)
    }
  }
}

const runRequestForBatch = async (rrnBatch) => {
  const graphUrl = strapi.config.get("server.deezerProxy.graphUrl");
  const header = await buildHeaderForRequest();
  const representations = buildRepresentationsForBatch(rrnBatch);

  const params = {
    query: federationQuery,
    variables: {representations},
  }

  try {
    const res = await axios.post(graphUrl, JSON.stringify(params), {headers: header})
    if (res.data.errors) strapi.log.error(res.data.errors);
  } catch (err) {
    strapi.log.error(`Error while running cache warm cron job. Error: ${err.message}`)
  }
}

const buildRepresentationsForBatch = (rrnBatch) => {
  return rrnBatch.map(rrn => {
    return {__typename: 'MusicTeaserEditorial', rrn}
  })
}

const buildHeaderForRequest = async () => {
  const authToken = await strapi.authService.getAuthToken();
  return {
    'Content-Type': 'application/json',
    'rtlplus-client-id': 'RTL+ Music Strapi - CacheWarmerCronJob',
    'rtlplus-client-version': '1.0.0',
    Authorization: authToken
  }
}

const federationQuery = `
query GetMusicTeaserEditorials(
  $representations: [_Any!]!
) {
  _entities(representations: $representations) {
    ... on MusicTeaserEditorial {
      element {
        __typename
        ... on MusicTrack {
          __typename
          id
        }
        ... on MusicAlbum {
          __typename
          id
        }
        ... on MusicArtist {
          __typename
          id
        }
        ... on MusicPlaylist {
          __typename
          id
        }
        ... on MusicRadio {
          __typename
          id
        }
      }
    }
  }
}`
