'use strict';

module.exports = Node;

function Node(Node) {

    Node.greet = async function (msg) {
        return 'Greetings... ' + msg;
    }

    Node.remoteMethod('greet', {
        accepts: {arg: 'msg', type: 'string'},
        returns: {arg: 'greeting', type: 'string'},
        http: {path: '/sayhi', verb: 'get'}
    });

    Node.observe('access', function (ctx, next) {
        console.log(ctx.args);
        console.log("HI\n");
        next();
    });

    return Node;
}
