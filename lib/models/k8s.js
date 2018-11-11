'use strict';

module.exports = K8s;

function K8s(K8s) {

    K8s.executeCommand = async function (command) {
        function promiseFromChildProcess(child) {
            return new Promise(function (resolve, reject) {
                child.addListener("error", reject);
                child.addListener("exit", resolve);
            });
        }

        var configuration_model = K8s.app.models.configuration;

        var kubectl_command = configuration_model.find({
            where: {'key': {like: 'kubernetes_%'}},
            fields: {"key": true, "value": true}
        }).then(function (kubernetes_information) {

            var kube_configs = {};
            kubernetes_information.forEach(function (configs) {
                kube_configs[configs.key] = configs.value;
            });

            return kube_configs;

        }).then(function (kube_configs) {

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

    K8s.remoteMethod('executeCommand', {
        accepts: [{arg: 'command', type: 'string'}],
        returns: {arg: 'result', type: 'json'},
        http: {path: '/executeCommand', verb: 'get'}
    });

    K8s.observe('access', function (ctx, next) {
        console.log(ctx.args);
        console.log("K8s has been called!\n");
        next();
    });

    return K8s;
}
