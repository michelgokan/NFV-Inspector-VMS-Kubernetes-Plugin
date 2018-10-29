'use strict';

var loopback = require('loopback');

module.exports = SystemConfigurator;

/**
 * @class
 * @classdesc The passport configurator
 * @param {Object} app The LoopBack app instance
 * @returns {PassportConfigurator}
 */
function SystemConfigurator(app) {
    if (!(this instanceof SystemConfigurator)) {
        return new SystemConfigurator(app);
    }
    this.app = app;
}

SystemConfigurator.prototype.setupModels = function(options) {

}