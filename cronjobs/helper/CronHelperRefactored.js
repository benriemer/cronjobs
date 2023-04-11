const { BATCH_SIZE, THROTTLE } = require("./Constants");
const { hasValues } = require("./ArrayHelper");

class CronJobService {
  constructor(entityService) {
    this.entityService = entityService;
    this.cronJobUid = "api::cronjob.cronjob";
  }

  async getOptionsForCronJob(cronJobId) {
    const cronJobQueryResult = await this.entityService.findMany(
      this.cronJobUid,
      {
        populate: { cronjobOption: true },
        filters: { cronJobId: cronJobId },
      }
    );

    const options = this.getOptionsFromCronJobQueryResult(cronJobQueryResult);

    return { ...options, ...{ notRegistered: cronJobQueryResult.length === 0 } };
  }

  getOptionsFromCronJobQueryResult(cronJobQueryResult) {
    if (!hasValues(cronJobQueryResult)) {
      return this.buildOptions();
    }

    const cronJob = cronJobQueryResult[0];
    const {active, running, cronId} = cronJob;
    const batchSize = this.getAdditionalOption(
      cronJob.cronjobOption,
      "batchSize"
    );
    const throttle = this.getAdditionalOption(
      cronJob.cronjobOption,
      "throttle"
    );
    return this.buildOptions(active, running, cronId, batchSize, throttle);
  }

  getAdditionalOption(additionalOptions, optionName) {
    const options = additionalOptions.filter(
      (option) => option.name === optionName
    );

    if (!hasValues(options)) {
      return null;
    }

    return options[0].data;
  }

  buildOptions(
    isActive = true,
    running = false,
    cronId = undefined,
    batchSizeOptions,
    throttleOptions
  ) {
    const batchSize = batchSizeOptions
      ? batchSizeOptions
      : BATCH_SIZE.deezerRequest;
    const throttle = throttleOptions ? throttleOptions : THROTTLE.axios;
    const active = isActive;

    return { batchSize, throttle, active, running, cronId };
  }

  async finishCronJob(cronJobPk = undefined) {
    if (cronJobPk) {
      await this.entityService.update(this.cronJobUid, cronJobPk, {
        data: { running: false },
      });
    }
  }

  async startCronJob(cronJobPk = undefined) {
    if (cronJobPk) {
      await this.entityService.update(this.cronJobUid, cronJobPk, {
        data: {
          running: true,
        },
      });
    }
  }
}

module.exports = CronJobService;
