'use strict';
var utils = require('./utils');

module.exports = Nodetype;

function Nodetype(loopbackApplication, options) {
    loopbackApplication.use(function (req, res, next) {
        console.log(options);
        next();
    });
}
