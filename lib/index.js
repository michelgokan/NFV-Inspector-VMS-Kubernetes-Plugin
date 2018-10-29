'use strict';

var loopback = require('loopback');
var DataModel = loopback.PersistedModel || loopback.DataModel;

function loadModel(jsonFile) {
    var modelDefinition = require(jsonFile);
    return DataModel.extend(modelDefinition.name,
        modelDefinition.properties,
        {
            relations: modelDefinition.relations,
        });
}

var NodeTypeModel = loadModel('./models/node-type.json');

exports.NodeType = require('./models/node-type')(NodeTypeModel);


exports.NodeType.autoAttach = 'db';

//exports.NFVInspector.NFVVMS.Configuration = require('./passport-configurator');