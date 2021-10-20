'use strict';

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'accounts',
    environment,
    rootURL: '/',
    locationType: 'auto',
    redirectUri: "http://general.pharbers.com",
    pharbersUri: "http://www.pharbers.com",
    reportsUri: "http://reports.pharbers.com",
    host: "http://accounts.pharbers.com",
    // invokeUrl: "https://2t69b7x032.execute-api.cn-northwest-1.amazonaws.com.cn",
    invokeUrl: "https://apiv2.pharbers.com",
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. EMBER_NATIVE_DECORATOR_SUPPORT: true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
    ENV.redirectUri = "http://general.pharbers.com:4200"
	ENV.host = "http://accounts.pharbers.com"
	ENV.namespace = "v0"
    ENV.pharbersUri = "http://www.pharbers.com:4300"
    ENV.reportsUri = "http://reports.pharbers.com:4400",
    // ENV.invokeUrl = "https://2t69b7x032.execute-api.cn-northwest-1.amazonaws.com.cn"
    ENV.invokeUrl = "https://apiv2.pharbers.com"
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
	ENV.redirectUri = "http://general.pharbers.com"
	ENV.host = "http://accounts.pharbers.com"
	ENV.namespace = "v0"
    ENV.pharbersUri = "http://www.pharbers.com"
    ENV.reportsUri = "http://reports.pharbers.com"
    // ENV.invokeUrl = "https://2t69b7x032.execute-api.cn-northwest-1.amazonaws.com.cn"
    ENV.invokeUrl = "https://apiv2.pharbers.com"
    // here you can enable a production-specific feature
  }

  return ENV;
};
