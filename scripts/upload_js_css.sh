#!/bin/bash

#a simple help
if [ "$1" == "-h" ]; then
    usage="$(basename "$0") [-h] [--tag] -- program to upload bokeh js and css to Rackspace

    where:
        -h     show this help text

        -t     the tag in the form X.X.X or X.X.X.dev.xxxxxx for dev builds
        -s     the subdirectory to upload: release or dev, defaults release
        -u     RackSpace username
        -k     RackSpace APIkey
    "
    echo "$usage"
    exit 0
fi

#defaults
subdir=release

#options management
while getopts t:s:i:u:k: option;
do
    case "${option}" in
        t) tag=${OPTARG};;
        s) subdir=${OPTARG};;
        u) username=${OPTARG};;
        k) key=$OPTARG;;
    esac 
done

#get user and key from env variables if they are not provided with args
if [ "$username" == "" ]; then
    username=$BOKEH_DEVEL_USERNAME
    echo "$username"
fi

if [ "$key" == "" ]; then
    key=$BOKEH_DEVEL_APIKEY
    echo "$key"
fi

#get the token and id
token=`curl -s -XPOST https://identity.api.rackspacecloud.com/v2.0/tokens \
-d'{"auth":{"RAX-KSKEY:apiKeyCredentials":{"username":"'$username'","apiKey":"'$key'"}}}' \
-H"Content-type:application/json" | python -c 'import sys,json;data=json.loads(sys.stdin.read());print(data["access"]["token"]["id"])'`

id=`curl -s -XPOST https://identity.api.rackspacecloud.com/v2.0/tokens \
-d'{"auth":{"RAX-KSKEY:apiKeyCredentials":{"username":"'$username'","apiKey":"'$key'"}}}' \
-H"Content-type:application/json" | python -c 'import sys,json;data=json.loads(sys.stdin.read());print(data["access"]["serviceCatalog"][-1]["endpoints"][0]["tenantId"])'`

#push the js and css files
curl -XPUT -T ../bokehjs/build/js/bokeh.js -v -H "X-Auth-Token:$token" -H "Content-Type: application/javascript" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-$tag.js";
curl -XPUT -T ../bokehjs/build/js/bokeh.min.js -v -H "X-Auth-Token:$token" -H "Content-Type: application/javascript" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-$tag.min.js";
curl -XPUT -T ../bokehjs/build/css/bokeh.css -v -H "X-Auth-Token:$token" -H "Content-Type: text/css" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-$tag.css";
curl -XPUT -T ../bokehjs/build/css/bokeh.min.css -v -H "X-Auth-Token:$token" -H "Content-Type: text/css" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-$tag.min.css";

