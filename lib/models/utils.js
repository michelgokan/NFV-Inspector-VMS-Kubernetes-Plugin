'use strict';

var crypto = require('crypto');
var assert = require('assert');


function getModel(cls, base) {
  if (!cls) {
    return base;
  }
  return (cls.prototype instanceof base) ? cls : base;
}


exports.getModel = getModel;