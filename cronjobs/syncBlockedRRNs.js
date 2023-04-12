const {getAddAndDeleteList} = require("../src/helper/get-rrn-diff-of-two-arrays");
const SELECT_QUERY = `SELECT rrn FROM blocklists`;

const getDbRrns = async (strapi) => {
  try {
    const [rows] = await strapi.db.connection.raw(SELECT_QUERY);
    return rows.map((row) => row.rrn);
  } catch (error) {
    throw new Error(`Error while fetching blocklist entries: ${error.message}`);
  }
};

const getCachedRrns = async (pattern = '', strapi) => {
  return await strapi.blocklistService.fetchKey(pattern);
};

const deleteRrnFromBlocklist = async (rrn, strapi) => {
  await strapi.blocklistService.deleteKey(rrn);
};

const pushRrnToBlocklist = async (rrn, strapi) => {
  await strapi.blocklistService.createKey(rrn);
};

module.exports = {
  syncBlockedRRNs: async (strapi) => {
    try {
      const isClientConfigured = strapi?.blocklistService?.config?.client?.status === 'ready';
      if (!isClientConfigured) {
        throw new Error("Sync Blocked RRN's: Blocklist service is not properly configured.");
      }

      const dbRrns = await getDbRrns(strapi);
      const cachedRrns = await getCachedRrns('rrn*', strapi);

      const { toDelete, toAdd } = getAddAndDeleteList(dbRrns, cachedRrns);

      const deletePromises = [];
      for (const rrn of toDelete) {
        deletePromises.push(deleteRrnFromBlocklist(rrn, strapi));
      }
      await Promise.all(deletePromises);

      const pushPromises = [];
      for (const rrn of toAdd) {
        pushPromises.push(pushRrnToBlocklist(rrn, strapi));
      }
      await Promise.all(pushPromises);
    } catch (error) {
      strapi.log.error(error);
    }
  },
};
