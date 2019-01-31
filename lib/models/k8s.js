'use strict';

const math = require('mathjs');

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

function convertMilliCPUCapToCPUCores(cpu_cap) {
    var cpu_value_and_unit = cpu_cap.split("m");

    return cpu_value_and_unit.length == 1 ? cpu_value_and_unit[0] : cpu_value_and_unit[0] / 1000;
}

function convertMemoryCapToBytes(memory_cap) {
    var memory_value_and_unit = memory_cap.match(/[a-z]+|[^a-z]+/gi);
    var memory_value = 0;

    if (memory_value_and_unit.length == 1 || memory_value_and_unit.length == 1) { // in bytes OR in scientific notation format. i.e 123124e10
        memory_value = Number(memory_cap);
    } else { // a number plus a unit ( 1212e234 Ki or 12313 Ki )
        var unit = "";

        if (memory_value_and_unit.length == 4) { // in scientifc notation AND having a unit : i.e 12e43 Ki
            memory_value = memory_value_and_unit[0] + memory_value_and_unit[1] + memory_value_and_unit[2];
            unit = memory_value_and_unit[3] + "B";
        } else if (memory_value_and_unit.length == 2) { // a simple number with a unit : i.e 1231Ki or 1231P
            memory_value = memory_value_and_unit[0];
            unit = memory_value_and_unit[1] + "B";
        }

        memory_value = math.unit(memory_value+unit).toNumber("B");
    }

    return memory_value;
}

function K8s(K8s) {

    K8s.executeCommand = async function (command, JSONOutput) {
        var configs = getKubernetesConfiguration(K8s);

        var kubectl_command = configs.then(function (kube_configs) {
            const formatting = (JSONOutput ? " -o json" : "");
            return "kubectl --token " + kube_configs["kubernetes_token"] + " --server=\"" + kube_configs["kubernetes_api_protocol"] + "://" + kube_configs["kubernetes_api_address"] + ":" + kube_configs["kubernetes_api_port"] + "\" --insecure-skip-tls-verify=true " + command + formatting;
        });

        var result = kubectl_command.then(function (command) {
            var exec = require('child_process').exec;

            console.log(command);

            return new Promise(function (resolve, reject) {
                exec(command, {maxBuffer: 1024 * 10000}, function (error, stdout, stderr) {
                    try {
                        resolve(JSON.parse(stdout));
                    } catch (e) {
                        resolve(stdout);
                    }
                });
            });
        });

        return result;
    };

    K8s.getPods = async function () {
        var result = K8s.executeCommand("get pods --all-namespaces", true).then(function (podsInK8sFormat) {
                var podsName = podsInK8sFormat.items.map(item => item.metadata.name);
                var podsAddress = podsInK8sFormat.items.map(item => item.status.podIP);
                //var podsCPUCap = podsInK8sFormat.items.map(item => item.spec.containers[0].resources.requests.cpu)

                var podsCPUCap = [];
                var podsMemoryCap = [];

                podsInK8sFormat.items.forEach(function (item) {
                    try {
                        podsCPUCap.push(typeof item.spec.containers[0].resources.limits.cpu !== 'undefined' ? convertMilliCPUCapToCPUCores(item.spec.containers[0].resources.limits.cpu) : '');
                    } catch (e) {
                        podsCPUCap.push('');
                    }

                    try {
                        podsMemoryCap.push(typeof item.spec.containers[0].resources.limits.memory !== 'undefined' ? convertMemoryCapToBytes(item.spec.containers[0].resources.limits.memory) : '');
                    } catch (e) {
                        podsMemoryCap.push('');
                    }
                });

                //TODO: Add container storage limit if there is any!
                //var podsStorageCap = podsInK8sFormat.items.map(item => item => );
                //var podsMemoryCap = podsInK8sFormat.items.map(item => (typeof item.spec.containers[0].resources.requests.memory !== 'undefined' ? item.spec.containers[0].resources.requests.memory : ''));

                var podsMetadata = podsInK8sFormat.items;

                var podsData = [];

                for (var i = 0; i < podsInK8sFormat.items.length; i++) {
                    podsData.push({
                        "name": podsName[i],
                        "address": podsAddress[i],
                        "cpu_cap": podsCPUCap[i],
                        //"storage_cap": podsStorageCap[i],
                        "memory_cap": podsMemoryCap[i],
                        "metadata": JSON.stringify(podsMetadata[i])
                    });
                }

                return podsData;
            }
        );

        return result;
    }
    ;

    K8s.getWorkers = async function () {
        var result = K8s.executeCommand("get nodes --all-namespaces", true).then(function (workersInK8sFormat) {
            var workersName = workersInK8sFormat.items.map(item => item.metadata.name);
            var workersAddress = workersInK8sFormat.items.map(item => item.status.addresses).map(address => address.filter(addressItem => (addressItem.type === "InternalIP"))[0].address);
            var workersCPUCap = workersInK8sFormat.items.map(item => convertMilliCPUCapToCPUCores(item.status.allocatable.cpu));
            var workersStorageCap = workersInK8sFormat.items.map(item => item.status.allocatable["ephemeral-storage"]);
            var workersMemoryCap = workersInK8sFormat.items.map(item => convertMemoryCapToBytes(item.status.allocatable.memory));
            var workersMetadata = workersInK8sFormat.items;

            var workersData = [];

            for (var i = 0; i < workersInK8sFormat.items.length; i++) {
                workersData.push({
                    "name": workersName[i],
                    "address": workersAddress[i],
                    "cpu_cap": workersCPUCap[i],
                    "storage_cap": workersStorageCap[i],
                    "memory_cap": workersMemoryCap[i],
                    "metadata": JSON.stringify(workersMetadata[i])
                });
            }

            return workersData;
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
        accepts: [{arg: 'command', type: 'string'},
            {arg: 'JSONOutput', type: 'boolean'}],
        returns: {arg: 'result', type: 'json'},
        http: {path: '/executeCommand', verb: 'get'}
    });

    K8s.remoteMethod('callAPI', {
        accepts: [{"arg": "path", "type": "string", "required": true},
            {"arg": "nodePort", "type": "number", "required": true}],
        returns: {arg: 'result', type: 'json'},
        http: {path: '/callAPI', verb: 'get'}
    });

    K8s.remoteMethod('getPods', {
        returns: {arg: 'result', type: 'json'},
        http: {path: '/getPods', verb: 'get'}
    });

    K8s.remoteMethod('getWorkers', {
        returns: {arg: 'result', type: 'json'},
        http: {path: '/getWorkers', verb: 'get'}
    });

    K8s.observe('access', function (ctx, next) {
        console.log(ctx.args);
        console.log("K8s has been called!\n");
        next();
    });

    return K8s;
}
