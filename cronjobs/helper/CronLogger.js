const axios = require("axios");

const CronLogger = (function () {
  let instance;

  function createInstance() {
    console.log("-> createInstance");
    return new _CronLogger();
  }

  return {
    getInstance: function () {
      console.log('-------> CRONLOGGER GET_INSTANCE: '. instance);
      if (!instance) {
        instance = createInstance();
        console.log('----> GetInstance CronLOGGER: ', instance);
      }

      return instance;
    }
  };
})();


module.exports = CronLogger;

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
    console.log("-------> start");
    const config = this.setConfig('ping', id, '/start')
    await this.setCall(config);
  }

  pause = async (id) => {
    console.log("-------> pause");
    const config =  this.setConfig('state', id, '/pause');
    await this.setCall(config);
  }

  fail = async (id, reason) => {
    console.log("-------> fail" );
    const config = this.setConfig('ping', id, '/fail', reason);
    await this.setCall(config);
  }

  ping = async (id) => {
    console.log("-------> ping");
    const config = this.setConfig('ping', id, null)
    await this.setCall(config);
  }

  setCall = async (config) => {
    console.log("-------> setCall");
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
