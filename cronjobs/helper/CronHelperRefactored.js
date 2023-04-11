const { BATCH_SIZE, THROTTLE, CRONJOBID } = require('./Constants');

class CronJobService {
  constructor(entityService) {
    this.entityService = entityService;
  }

  /**
   * The getOptionsForCronJob function returns an object containing the options for a given cron job.
   * @async
   * @param cronJobId The cronjob id from the strapi database
   *
   * @returns {Promise<object>} An object containing the options for the cron job, including active, running, cronId, batchSize, and throttle. If the cron job is not found, the method returns the default options.
   */
  async getOptionsForCronJob(cronJobId) {
    const cronJob = await this.getCronJobById(cronJobId);

    if (!cronJob) {
      return this.buildOptions();
    }

    const options = this.buildOptions(
      cronJob.active,
      cronJob.running,
      cronJob.id,
      this.getAdditionalOption(cronJob.cronjobOption, 'batchSize'),
      this.getAdditionalOption(cronJob.cronjobOption, 'throttle')
    );

    return {...options, ...{notRegistered: false}};
  }

  /**
   Finish a cron job by setting its running attribute to false.
   @async
   @param {number} cronJobPk - The primary key of the cron job to finish.
   @returns {Promise<boolean>} A promise that resolves to true if the update was successful, and false otherwise.
   */
  async finishCronJob(cronJobPk) {
    try {
      await this.updateCronJob(cronJobPk, { running: false });
      return true;
    } catch (error) {
      return false;
    }
  }
  /**
   Start a cron job by setting its running attribute to true.
   @async
   @param {number} cronJobPk - The primary key of the cron job to start.
   @returns {Promise<boolean>} A promise that resolves to true if the update was successful, and false otherwise.
   */
  async startCronJob(cronJobPk) {
    try {
      await this.updateCronJob(cronJobPk, { running: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * The getCronJobById function returns a cronJob object with the given id.
   *
   * @async
   * @param cronJobId Find the cronjob in the database
   *
   * @return A cronjob object
   *
   */
  async getCronJobById(cronJobId) {
    const cronJobQueryResult = await this.entityService.findMany(CRONJOBID, {
      populate: {cronjobOption: true},
      filters: {cronJobId: cronJobId}
    });

    return cronJobQueryResult.length ? cronJobQueryResult[0] : null;
  }

  getAdditionalOption(additionalOptions, optionName) {
    const options = additionalOptions?.filter(option => option.name === optionName);

    return options?.[0]?.data ?? null;
  }

  buildOptions(isActive = true, running = false, cronId = undefined, batchSizeOptions, throttleOptions) {
    const batchSize = batchSizeOptions ?? BATCH_SIZE.deezerRequest;
    const throttle = throttleOptions ?? THROTTLE.axios;
    const active = isActive;

    return {batchSize, throttle, active, running, cronId};
  }

  async updateCronJob(cronJobPk, data) {
    if (cronJobPk) {
      await this.entityService.update(CRONJOBID, cronJobPk, { data });
    }
  }
}

module.exports = CronJobService;