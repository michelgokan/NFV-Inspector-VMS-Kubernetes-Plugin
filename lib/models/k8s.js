'use strict';

module.exports = K8s;

function getKubernetesConfiguration(K8s) {
    var configuration_model = K8s.app.models.configuration;

    var model = configuration_model.find({
        where: {'key': {like: 'kubernetes_%'}},
        fields: {"key": true, "value": true}
    }).then(function (kubernetes_information) {

        var kube_configs = {};
        kubernetes_information.forEach(function (configs) {
            kube_configs[configs.key] = configs.value;
        });

        return kube_configs;
    });

    return model;
}

function K8s(K8s) {

    K8s.executeCommand = async function (command) {
        var configs = getKubernetesConfiguration(K8s);

        var kubectl_command = configs.then(function (kube_configs) {
            return "kubectl --token " + kube_configs["kubernetes_token"] + " --server=\"" + kube_configs["kubernetes_api_protocol"] + "://" + kube_configs["kubernetes_api_address"] + ":" + kube_configs["kubernetes_api_port"] + "\" --insecure-skip-tls-verify=true " + command + " -o json";
        });

        var result = kubectl_command.then(function (command) {
            var exec = require('child_process').exec;

            console.log(command);

            return new Promise(function (resolve, reject) {
                exec(command, {maxBuffer: 1024 * 10000}, function (error, stdout, stderr) {
                    try {
                        resolve(JSON.parse(stdout));
                    } catch(e){
                        resolve(stdout);
                    }
                });
            });
        });

        return result;
    };

    K8s.callAPI = async function (path, nodePort) {
        var request = require('needle');
        var configs = getKubernetesConfiguration(K8s);


        var full_path = configs.then(function (kube_configs) {
            return /*kube_configs["kubernetes_api_protocol"]*/ 'http://' + kube_configs["kubernetes_api_address"] + ":" + nodePort + path;
        });

        var result = full_path.then(function (request_uri) {
            console.log("Sending request to " + request_uri);

            process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

            var request_result = new Promise(function (resolve, reject) {
                var options = {
                    rejectUnauthorized: false,
                    strictSSL: false,
                    secureProtocol: 'TLSv1_2_method'
                };

                request.get(request_uri, options, function (error, response) {
                    if (!error && response.statusCode == 200) {
                        console.log(response.body);
                        resolve(response.body);
                    } else {
                        console.error("Error: " + error);

                        if (error === null) {
                            console.error("Response code: " + response.statusCode);
                            console.error("Body: " + response.body);
                        }

                        var err = new Error("ERROR");
                        err.statusCode = err.status = (error ? 500 : response.statusCode);
                        err.code = 'API_CALL_ERROR';
                        resolve(Promise.reject());
                    }
                });
            });

            return request_result;
        });

        return result;
    };

    K8s.remoteMethod('executeCommand', {
        accepts: [{arg: 'command', type: 'string'}],
        returns: {arg: 'result', type: 'json'},
        http: {path: '/executeCommand', verb: 'get'}
    });

    K8s.remoteMethod('callAPI', {
        accepts: [{"arg": "path", "type": "string", "required": true},
            {"arg": "nodePort", "type": "number", "required": true}],
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