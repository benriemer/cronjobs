const {DEFAULT_SCHEDULES, CRONJOB_HEALTH_CHECKS} = require("./helper/Constants");
const {getOptionsForCronJob, startCronJob, finishCronJob} = require("./helper/CronHelper");
const {timeStart, timeEnd} = require("./helper/TimeHelper");
const {CronLogger} = require("./helper/CronLogger");


module.exports = (schedule = undefined, cronJobId, exec) => {
  return {
    task: async ({strapi}) => {
      if (!exec) console.error(`Registered CronJob ${cronJobId} but no exec added!`);
      const options = await getOptions(cronJobId);

      if (options) {
        try {
          await start(cronJobId, options)

          await exec(strapi, options)

          await end(cronJobId, options)
        } catch (e) {
          strapi.log.error(e);
          const cronLogger = CronLogger.getInstance();
          cronLogger.fail(CRONJOB_HEALTH_CHECKS[cronJobId], e);
        }
      }
    },
    options: {
      rule: initSchedule(schedule, cronJobId)
    },
  }
};

const initSchedule = (schedule, cronJobId) => {
  const time = schedule || DEFAULT_SCHEDULES.deleteOldTracksCronJob;
  console.log(`Init cron job (id: ${cronJobId}) with schedule of: ${schedule}.`)
  return time;
}

const getOptions = async (cronJobId) => {
  const options = await getOptionsForCronJob(cronJobId);
  if (!options.active || options.running || options.notRegistered) {
    return null;
  } else {
    return options;
  }
}

const start = async (cronJobId, options) => {
  const success = await startCronJob(options.cronId);
  if (success) {
    timeStart(cronJobId, cronJobId);
  } else {
    strapi.log.error(`Error starting cron job with ID ${cronJobId}`);
  }
}

const end = async (cronJobId, options) => {
  const success = await finishCronJob(options.cronId);
  if (success) {
    timeEnd(cronJobId, cronJobId)
  } else {
    strapi.log.error(`Error finishing cron job with ID ${cronJobId}`);
  }
}