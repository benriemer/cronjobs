const timeStart = (cronJobName, message = 'CronJob') => {
  console.time(cronJobName)
  strapi.log.info(`Started ${message} | Date: ${new Date().toISOString()}`)
}

const timeEnd = (cronJobName, message = 'CronJob finished') => {
  strapi.log.info(`Finished ${message} | Date: ${new Date().toISOString()}`)
  console.timeEnd(cronJobName)
}

module.exports = {
  timeStart,
  timeEnd
}
