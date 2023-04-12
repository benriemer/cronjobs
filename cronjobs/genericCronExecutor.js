const { getOptionsForCronJob, startCronJob, finishCronJob} = require('./helper/CronHelper');
const { timeStart, timeEnd} = require('./helper/TimeHelper');
const { CronLogger } = require('./helper/CronLogger');

module.exports = async (strapi, cronjobID, exec) => {
  const {defaultSchedule, cronjobId, cronjobHealtcheck} = await getOptionsForCronJob(strapi, cronjobID)
  console.log("SCHEDULE: ", defaultSchedule, "CRONJOB ID: ", cronjobId);
  if (!exec) {
    console.error(`Registered CronJob ${cronjobId} but no exec added!`);
    return;
  }

  const options = await getOptions(cronjobId);
  if (!options) {
    return;
  }

  try {
    await startAndEnd(strapi, cronjobId, options, async () => {
      await exec(strapi, options);
    });
  } catch (e) {
    handleError(strapi.log, cronjobId, e);
  }

  return {
    options: {
      rule: defaultSchedule,
    },
  };
};

const getOptions = async (cronJobId) => {
  const options = await getOptionsForCronJob(cronJobId);
  if (!options.active || options.running || options.notRegistered) {
    return null;
  } else {
    return options;
  }
};

const startAndEnd = async (strapi, cronJobId, options, task) => {
  await startCronJob(cronJobId);
  timeStart(cronJobId);
  await task();
  await finishCronJob(options.cronId);
  timeEnd(cronJobId, cronJobId);
};

const handleError = (cronJobId, e) => {
  strapi.log.error(e);
  const cronLogger = CronLogger.getInstance();
  cronLogger.fail(cronJobId, e);
};