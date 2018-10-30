'use strict';

module.exports = Node;

function Node(Node) {

    Node.greet = async function(msg) {
        return 'Greetings... ' + msg;
    }

    Node.remoteMethod('greet', {
        accepts: {arg: 'msg', type: 'string'},
        returns: {arg: 'greeting', type: 'string'}
    });

    return Node;
}
