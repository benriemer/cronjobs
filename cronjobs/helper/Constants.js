const ASSET_KEY = Object.freeze({
  album: 'album',
  playlist: 'playlist',
  artist: 'artist'
});

const BATCH_SIZE = Object.freeze({
  deezerRequest: 100,
  database: 100
});

const THROTTLE = Object.freeze({
  axios: 5,
});

const REDIS = Object.freeze({
  key: 'potentialOrphans'
});

const MY_SQL = Object.freeze({
  wildCard: '%'
});

const CRONJOB_IDS = new Map([
  ['deleteOldTracksCronJob', 'deleteOldTracksCronJob'],
  ['removeOrphanCronJob', 'removeOrphanCronJob'],
  ['fetchRadioStationsCronJob', 'fetchRadioStationsCronJob'],
  ['collectOrphanCronJob', 'collectOrphanCronJob'],
  ['pageGeneratorCronJob', 'pageGeneratorCronJob'],
  ['createAndUploadCronJob', 'createAndUploadCronJob'],
  ['cacheWarmerCronJob', 'cacheWarmerCronJob'],
  ['syncBlockedRRNsCronJob', 'syncBlockedRRNsCronJob'],
]);

const CRONJOB_HEALTH_CHECKS = new Map([
  ['deleteOldTracksCronJob', process.env.DELETE_OLD_TRACKS_HEALTH_UUID],
  ['removeOrphanCronJob', process.env.REMOVE_ORPHANS_HEALTH_UUID],
  ['fetchRadioStationsCronJob', process.env.FETCH_RADIO_CRON_HEALTH_UUID],
  ['collectOrphanCronJob', process.env.COLLECT_ORPHANS_HEALTH_UUID],
  ['pageGeneratorCronJob', process.env.PAGE_GENERATOR_HEALTH_UUID],
  ['createAndUploadCronJob', process.env.CREATE_AND_UPLOAD_HEALTH_UUID],
  ['cacheWarmerCronJob', process.env.CACHE_WARMER_HEALTH_UUID],
  ['syncBlockedRRNsCronJob', process.env.SYNC_BLOCKED_RRN_HEALTH_UUID],
]);

const DEFAULT_SCHEDULES = new Map([
  ['deleteOldTracksCronJob', '59 59 */23 * * *'],
  ['removeOrphanCronJob', '0 1 * * *'],
  ['fetchRadioStationsCronJob', '* * * * *'],
  ['collectOrphanCronJob', '0 2 * * *'],
  ['pageGeneratorCronJob', '* * * * *'], //default */30 * * * *
  ['createAndUploadCronJob', '30 1 * * *'],
  ['cacheWarmerCronJob', '*/10 * * * *'],
  ['syncBlockedRRNsCronJob', '0 3 * * *'],
]);

/**
 * The getCronjobConfigs function returns an object containing the default schedule, cronjob healthcheck ID and cronjob ID for a given cronjob name.
 *
 * @param cronjobName Get the defaultschedule and cronjobid
 *
 * @return An object with three properties:
 *
 */
const getCronjobConfigs = (cronjobName) => {
  const defaultSchedule = DEFAULT_SCHEDULES.get(cronjobName);
  const cronjobId = CRONJOB_IDS.get(cronjobName);
  const cronjobHealtcheck = CRONJOB_HEALTH_CHECKS.get(cronjobName);

  if (!defaultSchedule || !cronjobId || !cronjobHealtcheck) {
    throw new Error(`Invalid cronjob name: ${cronjobName}`);
  }

  return {
    defaultSchedule,
    cronjobId,
    cronjobHealtcheck
  };
}

const CRONJOBUUID = 'api::cronjob.cronjob';


module.exports = {
  ASSET_KEY,
  BATCH_SIZE,
  REDIS,
  MY_SQL,
  THROTTLE,
  CRONJOBID: CRONJOBUUID,
  getCronjobConfigs,
};


