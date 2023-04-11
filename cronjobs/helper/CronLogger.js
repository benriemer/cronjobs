const axios = require("axios");

const CronLogger = (function () {
  let instance;

  function createInstance() {
    return new _CronLogger();
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
        console.log('GetInstance CronLOGGER');
      }

      return instance;
    }
  };
})();


module.exports = {CronLogger};

class _CronLogger {
  setConfig = (kind, id, suffix, body = null) => {
    let config = {}

    switch (kind) {
      case 'ping':
        config = {
          method: 'get',
          url: `${process.env.HEALTH_PING_BASE}${id}${suffix || ''}`,
        }
        break;
      case 'state':
        config = {
          method: 'post',
          headers: {
            'X-Api-Key': `${process.env.HEALTH_CHECK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          url: `${process.env.HEALTH_STATE_BASE}${id}${suffix}`,
          data: body || {}
        }
        break;
      case 'flip':
        config = {
          method: 'get',
          headers: {
            'X-Api-Key': `${process.env.HEALTH_CHECK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          url: `${process.env.HEALTH_STATE_BASE}${id}${suffix}`,
          data: body || {}
        }
        break;
    }

    return config
  }

  start = async (id) => {
    const config = this.setConfig('ping', id, '/start')
    await this.setCall(config);
  }

  pause = async (id) => {
    const config =  this.setConfig('state', id, '/pause');
    await this.setCall(config);
  }

  fail = async (id, reason) => {
    const config = this.setConfig('ping', id, '/fail', reason);
    await this.setCall(config);
  }

  ping = async (id) => {
    const config = this.setConfig('ping', id, null)
    await this.setCall(config);
  }

  setCall = async (config) => {
    if (!config.url?.length) return;
    try {
      const response = await axios(config);
      return response.data;
    } catch (err) {
      strapi.log.error(err);
      return null;
    }
  }
}
