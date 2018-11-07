'use strict';

module.exports = Kubernetesnode;

function Kubernetesnode(Kubernetesnode) {

    Kubernetesnode.nodesInformation = async function (node_type) {
        return 'node_type = ' + node_type;
    };

    Kubernetesnode.remoteMethod('nodesInformation', {
        accepts: {arg: 'node_type', type: 'string'},
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
