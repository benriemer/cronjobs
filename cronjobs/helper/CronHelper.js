const { BATCH_SIZE, THROTTLE } = require("./Constants");
const { checkIfArrayWithValues } = require("./ArrayHelper");

const CronJobUid = 'api::cronjob.cronjob';

async function getOptionsForCronJob(strapi, cronJobId) {
  const cronJobQueryResult = await strapi.entityService.findMany(CronJobUid, {
    populate: { cronjobOption: true },
    filters: { cronJobId },
  });

  const options = getOptionsFromCronJobQueryResult(cronJobQueryResult);

  return { ...options, ...{ notRegistered: cronJobQueryResult.length === 0 } };
}

function getOptionsFromCronJobQueryResult(cronJobQueryResult) {
  if (!checkIfArrayWithValues(cronJobQueryResult)) {
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

function getAdditionalOption(additionalOptions, optionName) {
  if (!checkIfArrayWithValues(additionalOptions)) {
    return null;
  }

  const options = additionalOptions.filter(option => option.name === optionName);

  if (!checkIfArrayWithValues(options)) {
    return null;
  }

  return options[0].data;
}

function buildOptions(isActive = true, running = false, cronId = undefined, batchSizeOptions, throttleOptions) {
  const batchSize = batchSizeOptions ? batchSizeOptions : BATCH_SIZE.deezerRequest;
  const throttle = throttleOptions ? throttleOptions : THROTTLE.axios;
  const active = isActive;

  return { batchSize, throttle, active, running, cronId };
}

async function finishCronJob(cronJobPk = undefined) {
  if (cronJobPk) {
    await strapi.entityService.update(CronJobUid, cronJobPk, {
      data: { running: false },
    });
  }
}

async function startCronJob(cronJobPk = undefined) {
  if (cronJobPk) {
    await strapi.entityService.update(CronJobUid, cronJobPk, {
      data: {
        running: true,
      },
    });
  }
}

module.exports = { getOptionsForCronJob, finishCronJob, startCronJob }