'use strict';

var loopback = require('loopback');
var DataModel = loopback.PersistedModel || loopback.DataModel;

function loadModel(jsonFile) {
    var modelDefinition = require(jsonFile);
    return DataModel.extend(modelDefinition.name,
        modelDefinition.properties,
        {
            relations: modelDefinition.relations,
            foreignKeys: modelDefinition.foreignKeys
        });
}

var K8s = loadModel('./models/k8s.json');
// var NodeTypeModel = loadModel('./models/node-type.json');
// var NodeModel = loadModel('./models/node.json');

exports.K8s = require('./models/k8s')(K8s);
// exports.Nodetype = require('./models/node-type')(NodeTypeModel);
// exports.Node = require('./models/node')(NodeModel);

module.exports = function (nfvinspector, options) {
    nfvinspector.model(exports.K8s);
    // nfvinspector.model(exports.Nodetype, { dataSource: 'mysql' });
    // nfvinspector.model(exports.Node, { dataSource: 'mysql' });
};