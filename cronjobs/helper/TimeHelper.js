const logWithTime = (cronJobName, message) => {
  const timestamp = new Date().toISOString();
  strapi.log.info(`${message} ${cronJobName} | Date: ${timestamp}`);
};

const timeStart = (cronJobName) => {
  console.time(cronJobName);
  logWithTime(cronJobName, "Started");
};

const timeEnd = (cronJobName) => {
  console.timeEnd(cronJobName);
  logWithTime(cronJobName, "Finished");
};

module.exports = {
  timeStart,
  timeEnd
};
