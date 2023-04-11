const { BATCH_SIZE, THROTTLE } = require('./Constants');
const { hasValues } = require('./ArrayHelper');

const CronJobUid = 'api::cronjob.cronjob';
const getOptionsForCronJob = async (cronJobId) => {
  const cronJobQueryResult = await strapi.entityService.findMany(CronJobUid, {
    populate: {cronjobOption: true},
    filters: {cronJobId: cronJobId}
  });

  const options = getOptionsFromCronJobQueryResult(cronJobQueryResult);

  return {...options, ...{notRegistered: cronJobQueryResult.length === 0}}
}
const getOptionsFromCronJobQueryResult = (cronJobQueryResult) => {

  if (!hasValues(cronJobQueryResult)) {
    return buildOptions();
  }

  const cronJob = cronJobQueryResult[0];
  const active = cronJob.active;
  const running = cronJob.running;
  const cronId = cronJob.id;
  const batchSize = getAdditionalOption(cronJob.cronjobOption, 'batchSize');
  const throttle = getAdditionalOption(cronJob.cronjobOption, 'throttle');
  return buildOptions(active, running, cronId, batchSize, throttle);
}

const getAdditionalOption = (additionalOptions, optionName) => {
  if (!hasValues(additionalOptions)) {
    return null;
  }

  const options = additionalOptions.filter(option => option.name === optionName);

  if (!hasValues(options)) {
    return null;
  }

  return options[0].data;
}

const buildOptions = (isActive = true, running = false, cronId = undefined, batchSizeOptions, throttleOptions) => {
  const batchSize = batchSizeOptions ? batchSizeOptions : BATCH_SIZE.deezerRequest;
  const throttle = throttleOptions ? throttleOptions : THROTTLE.axios;
  const active = isActive;

  return {batchSize, throttle, active, running, cronId};
}

const finishCronJob = async (cronJobPk = undefined) => {
  if (cronJobPk) {
    await strapi.entityService.update(CronJobUid, cronJobPk, {
      data: {running: false}
    });
  }
}

const startCronJob = async (cronJobPk = undefined) => {
  if (cronJobPk) {

     await strapi.entityService.update(CronJobUid, cronJobPk, {
      data: {
        running: true,
      }
    });
  }
}

module.exports = {
  getOptionsForCronJob,
  finishCronJob,
  startCronJob
}
