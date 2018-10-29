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

exports.Nodetype = require('./models/node-type')(NodeTypeModel);


exports.Nodetype.autoAttach = 'db';

//exports.NFVInspector.NFVVMS.Configuration = require('./passport-configurator');