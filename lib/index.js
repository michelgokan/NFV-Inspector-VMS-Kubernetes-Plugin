'use strict';

var loopback = require('loopback');
var PersistedDataModel = loopback.PersistedModel; // || loopback.DataModel;
var BaseDataModel = loopback.DataModel;

function loadPersistedModel(jsonFile) {
    var modelDefinition = require(jsonFile);
    return PersistedDataModel.extend(modelDefinition.name,
        modelDefinition.properties,
        {
            relations: modelDefinition.relations,
            foreignKeys: modelDefinition.foreignKeys
        });
}

function loadDataModel(jsonFile) {
    var modelDefinition = require(jsonFile);
    return BaseDataModel.extend(modelDefinition.name,modelDefinition.properties,{});
}

var K8s = loadDataModel('./models/k8s.json');
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