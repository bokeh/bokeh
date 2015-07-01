#!/bin/bash

#################
# General setup #
#################

# CLI user interface
if [ "$1" == "-h" ]; then
    usage="$(basename "$0") [-h] -- program to build and upload bokeh pkgs to binstar

    where:
        -h     show this help text

        -b     Binstar token
        -u     RackSpace username
        -k     RackSpace APIkey
        -c     whether to clean the built packages, defaults to true
        -l     whether to build locally, defaults to false
    "
    echo "$usage"
    exit 0
fi

# defauls
clean=true
local=false

# handling of arguments
while getopts b:u:k:c:l: option
do
    case "${option}" in
        b) bintoken=${OPTARG};;
        u) username=${OPTARG};;
        k) key=${OPTARG};;
        c) clean=${OPTARG};;
        l) local=${OPTARG};;
    esac 
done

# get binstar token from env variable if it is not provided with args
if [ "$bintoken" == "" ]; then
    bintoken=$BOKEH_DEVEL_TOKEN
    echo "$bintoken"
fi

# get user and key from env variables if they are not provided with args
if [ "$username" == "" ]; then
    username=$BOKEH_DEVEL_USERNAME
    echo "$username"
fi

if [ "$key" == "" ]; then
    key=$BOKEH_DEVEL_APIKEY
    echo "$key"
fi

# get conda info about root_prefix and platform
function conda_info {
    conda info --json | python -c "import json, sys; print(json.load(sys.stdin)['$1'])"
}

CONDA_ENV=$(conda_info root_prefix)
PLATFORM=$(conda_info platform)
BUILD_PATH=$CONDA_ENV/conda-bld/$PLATFORM

# create an empty __travis_build_id__.txt file if you are building locally
if [ $local == true ]; then
    echo "" > __travis_build_id__.txt
fi

# get travis_build_id
travis_build_id=$(cat __travis_build_id__.txt)

# get complete version
complete_version=$(cat __conda_version__.txt)

# specify some varibles specific of the release or devel build process
if [[ -z "$travis_build_id" ]]; then
    #release
    channel=main              #binstar channel
    register=register         #register to pypi
    upload=upload             #upload to pypi
    subdir=release            #CDN subdir where to upload the js and css
else
    #devel build
    channel=dev               #binstar channel
    register=""               #register to pypi
    upload=""                 #upload to pypi
    subdir=dev                #CDN subdir where to upload the js and css
fi

# remove the first bokeh build (by travis_install) to avoid its upload
first_build_loc=$BUILD_PATH/bokeh*.tar.bz2
rm -rf $first_build_loc
echo "Removing first bokeh build at $first_build_loc"

#########################
# Build and upload pkgs #
#########################

# build for each python version
for py in 27 33 34;
do
    echo "Building py$py pkg"
    CONDA_PY=$py conda build conda.recipe --quiet
done

# convert to platform-specific builds
conda convert -p all -f $BUILD_PATH/bokeh*$travis_build_id*.tar.bz2 --quiet
echo "pkgs converted"

# upload conda pkgs to binstar
platforms=(osx-64 linux-64 win-64 linux-32 win-32)
for plat in "${platforms[@]}"
do
    echo Uploading: $plat
    binstar -t $bintoken upload -u bokeh $plat/bokeh*$travis_build_id*.tar.bz2 -c $channel --force --no-progress
done

# create, register and upload pypi pkgs to pypi and binstar
# zip is currently not working on binstar
python setup.py $register sdist --formats=gztar,zip $upload
echo "sdist pkg built"
if [[ ! -z "$upload" ]]; then
    echo "I'm done uploading to pypi"
fi

binstar -t $bintoken upload -u bokeh dist/bokeh*$travis_build_id*.tar.gz --package-type pypi -c $channel --force --no-progress
echo "I'm done uploading to binstar"

###########################
# JS and CSS into the CDN #
###########################

# get token
token=`curl -s -XPOST https://identity.api.rackspacecloud.com/v2.0/tokens \
-d'{"auth":{"RAX-KSKEY:apiKeyCredentials":{"username":"'$username'","apiKey":"'$key'"}}}' \
-H"Content-type:application/json" | python -c 'import sys,json;data=json.loads(sys.stdin.read());print(data["access"]["token"]["id"])'`

# get unique url id
id=`curl -s -XPOST https://identity.api.rackspacecloud.com/v2.0/tokens \
-d'{"auth":{"RAX-KSKEY:apiKeyCredentials":{"username":"'$username'","apiKey":"'$key'"}}}' \
-H"Content-type:application/json" | python -c 'import sys,json;data=json.loads(sys.stdin.read());print(data["access"]["serviceCatalog"][-1]["endpoints"][0]["tenantId"])'`

# push the js and css files
curl -XPUT -T bokehjs/build/js/bokeh.js -v -H "X-Auth-Token:$token" -H "Content-Type: application/javascript" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-$complete_version.js";
curl -XPUT -T bokehjs/build/js/bokeh.min.js -v -H "X-Auth-Token:$token" -H "Content-Type: application/javascript" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-$complete_version.min.js";
curl -XPUT -T bokehjs/build/css/bokeh.css -v -H "X-Auth-Token:$token" -H "Content-Type: text/css" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-$complete_version.css";
curl -XPUT -T bokehjs/build/css/bokeh.min.css -v -H "X-Auth-Token:$token" -H "Content-Type: text/css" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-$complete_version.min.css";

echo "I'm done uploading to Rackspace"

#########################
# Build and upload Docs #
#########################

pushd sphinx

make clean all

# to the correct location
if [[ -z "$travis_build_id" ]]; then
    fab deploy
    echo "I'm done uploading the release docs"
else
    fab update:dev
    echo "I'm done uploading the devel docs"
fi

popd



######################
# Publish to npm.org #
######################

pushd bokehjs

if [[ -z "$travis_build_id" ]]; then
    npm publish --tag $complete_version
    npm tag bokehjs@$complete_version latest
    echo "I'm done publishing to npmjs.org"
fi

popd

####################
# General clean up #
####################

#useful if you are doing it locally
if [ $clean == true ]; then
    # clean up platform folders
    for plat in "${platforms[@]}"
    do
        rm -rf $plat
    done
    # clean up the additional building stuff
    rm -rf dist/
    rm -rf build/
    rm -rf bokeh.egg-info/
    rm -rf record.txt
    rm -rf versioneer.pyc
    rm -rf __conda_version__.txt
    rm -rf bokeh/__conda_version__.py
    rm -rf bokeh/__conda_version__.pyc
    rm -rf bokeh/__pycache__/__conda_version__.pyc
else
    echo "Not cleaning at all."
fi
