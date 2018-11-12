'use strict';

module.exports = K8s;

function getKubernetesConfiguration() {
    var configuration_model = K8s.app.models.configuration;

    return configuration_model.find({
        where: {'key': {like: 'kubernetes_%'}},
        fields: {"key": true, "value": true}
    }).then(function (kubernetes_information) {

        var kube_configs = {};
        kubernetes_information.forEach(function (configs) {
            kube_configs[configs.key] = configs.value;
        });

        return kube_configs;

    });

}

function K8s(K8s) {

    K8s.executeCommand = async function (command) {
        var kubectl_command = getKubernetesConfiguration().then(function (kube_configs) {

            var execution_command = "kubectl --token " + kube_configs["kubernetes_token"] + " --server=\"" + kube_configs["kubernetes_api_protocol"] + "://" + kube_configs["kubernetes_api_address"] + ":" + kube_configs["kubernetes_api_port"] + "\" --insecure-skip-tls-verify=true " + command + " -o json";

            //console.log(execution_command);
            return execution_command;
        });

        var result = kubectl_command.then(function (command) {
            var exec = require('child_process').exec;

            console.log(command);

            return new Promise(function (resolve, reject) {
                exec(command, {maxBuffer: 1024 * 10000}, function (error, stdout, stderr) {
                    resolve(JSON.parse(stdout));
                });
            });
        });

        return result;
    };

    K8s.callAPI = async function (path, nodePort) {
        return getKubernetesConfiguration.then(function (kube_configs) {
            var request = require('request');

            var full_path = kube_configs["kubernetes_api_protocol"] + '://' + kube_configs["kubernetes_api_address"] + ":" + nodePort + path;

            console.log("Sending request to " + full_path);

            return request(full_path, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body);
                    return body;
                } else {
                    var error = new Error(error);
                    error.statusCode = error.status = response.statusCode;
                    error.code = 'API_CALL_ERROR';
                    return error;
                }
            });
        });
    };

    K8s.remoteMethod('executeCommand', {
        accepts: [{arg: 'command', type: 'string'}],
        returns: {arg: 'result', type: 'json'},
        http: {path: '/executeCommand', verb: 'get'}
    });

    K8s.remoteMethod('callAPI', { accepts: [{ "arg": "path", "type": "string","required": true },
                                            { "arg": "nodePort", "type": "number", "required": true }],
        returns: {arg: 'result', type: 'json'},
        http: {path: '/callAPI', verb: 'get'}
    });

    K8s.observe('access', function (ctx, next) {
        console.log(ctx.args);
        console.log("K8s has been called!\n");
        next();
    });

    return K8s;
}
