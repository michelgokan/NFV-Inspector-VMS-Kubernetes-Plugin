#!/bin/bash

PLUGIN_NAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd | xargs basename )"

echo "Checking for existing configuration..."
EXISTS=$( curl -X GET --header 'Accept: application/json' "http://127.0.0.1:3000/api/configurations/count?where=%7B%22category%22%3A%22$PLUGIN_NAME%22%7D" | jq ".count" )

if [ "$EXISTS" -eq "0" ]; then
  echo "No previous configuration exists..."
else
  echo "Configuration already exists..."
  echo "Please try reinstalling NFV-VMS!"
  echo "Exiting installation!"
  exit 0
fi


echo "Please enter Kubernetes API server address"

read -r kubernetes_api_address

echo "Please enter Kubernetes API server port"

read -r kubernetes_api_port

echo "HTTP or HTTPS: "

read -r kubernetes_api_protocol

echo "Attempting to connect to Kubernetes API server..."

kubernetes_api_test=$(curl -ks "$kubernetes_api_protocol://$kubernetes_api_address:$kubernetes_api_port/api/")

kubernetes_status=$(echo "$kubernetes_api_test" | jq '.versions')

if [ "$kubernetes_status" == "null" ]; then
    echo "Can't connect to Kubernetes with provided information!"
    echo $kubernetes_api_test
    echo "Exiting application!"
else
    echo "Successfully connected to Kubernetes!"
    echo "Saving plugin configs..."
    kubernetes_api_test_esc=`esc_var "$kubernetes_api_test"`
    kubernetes_api_test_esc=`echo $kubernetes_api_test_esc`

    curl -X POST --header 'Content-Type: application/json' --header \
     'Accept: application/json' -d \
     "{ \"category\": \"${PLUGIN_NAME}\", \"key\": \"kubernetes_api_address\", \"value\": \"$kubernetes_api_address\" }" \
     'http://127.0.0.1:3000/api/configurations'

     curl -X POST --header 'Content-Type: application/json' --header \
     'Accept: application/json' -d \
     "{ \"category\": \"${PLUGIN_NAME}\", \"key\": \"kubernetes_api_port\", \"value\": \"$kubernetes_api_port\" }" \
     'http://127.0.0.1:3000/api/configurations'

     curl -X POST --header 'Content-Type: application/json' --header \
     'Accept: application/json' -d \
     "{ \"category\": \"${PLUGIN_NAME}\", \"key\": \"kubernetes_api_protocol\", \"value\": \"$kubernetes_api_protocol\" }" \
     'http://127.0.0.1:3000/api/configurations'

     curl -X POST --header 'Content-Type: application/json' --header \
     'Accept: application/json' -d \
     "{ \"category\": \"${PLUGIN_NAME}\", \"key\": \"kubernetes_api_test\", \"value\": \"$kubernetes_api_test_esc\" }" \
     'http://127.0.0.1:3000/api/configurations'
fi
