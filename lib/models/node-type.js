'use strict';
var utils = require('./utils');

module.exports = Nodetype;

function Nodetype(nodetypeApplication, options) {
    loopbackApplication.use(function (req, res, next) {
        console.log(options);
        next();
    });
}
