'use strict';

module.exports = Kubernetesnode;

function Kubernetesnode(Kubernetesnode) {

    Kubernetesnode.nodesInformation = async function (node_type, refresh_db) {
        var config = Kubernetesnode.app.models.configuration;

        return config.findOne({where: {'key': 'kubernetes_api_address'}});
    };

    Kubernetesnode.remoteMethod('nodesInformation', {
        accepts: [{arg: 'node_type', type: 'string'}, {arg: 'refresh_db', type: 'boolean'}],
        returns: {arg: 'nodes', type: 'json'},
        http: {path: '/nodesInformation', verb: 'get'}
    });

    Kubernetesnode.observe('access', function (ctx, next) {
        console.log(ctx.args);
        console.log("Kubernetesnode has been called!\n");
        next();
    });

    return Kubernetesnode;
}
