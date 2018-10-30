'use strict';

var loopback = require('loopback');
var DataModel = loopback.PersistedModel || loopback.DataModel;

function loadModel(jsonFile) {
    var modelDefinition = require(jsonFile);
    return DataModel.extend(modelDefinition.name,modelDefinition.options,
        modelDefinition.properties,
        {
            relations: modelDefinition.relations,
            foreignKeys: modelDefinition.foreignKeys
        });
}

var NodeTypeModel = loadModel('./models/node-type.json');
var NodeModel = loadModel('./models/node.json');

exports.Nodetype = require('./models/node-type')(NodeTypeModel);
exports.Node = require('./models/node')(NodeModel);

module.exports = function (loopbackApplication, options) {
    loopbackApplication.model(exports.Nodetype, { dataSource: 'mysql' });
    loopbackApplication.model(exports.Node, { dataSource: 'mysql' });
};