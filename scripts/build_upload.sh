#!/bin/bash

#################
# General setup #
#################

# CLI user interface
if [ "$1" == "-h" ]; then
    usage="$(basename "$0") [-h] -- program to build and upload bokeh pkgs to anaconda.org

    where:
        -h     show this help text

        -b     Anaconda.org token
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

# get anaconda.org token from env variable if it is not provided with args
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

# create an empty __travis_build_number__.txt file if you are building locally
if [ $local == true ]; then
    echo "" > __travis_build_number__.txt
fi

# get travis_build_number
travis_build_number=$(cat __travis_build_number__.txt)

# specify some varibles specific of the release or devel build process
if [[ "$travis_build_number" == "release" ]]; then
    #release
    channel=main              #anaconda.org channel
    register=register         #register to pypi
    upload=upload             #upload to pypi
    subdir=release            #CDN subdir where to upload the js and css
elif [[ "$travis_build_number" == "devel" ]]; then
    #devel build
    channel=dev               #anaconda.org channel
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
for py in 27 34;
do
    echo "Building py$py pkg"
    CONDA_PY=$py conda build conda.recipe --quiet
done

# convert to platform-specific builds
conda convert -p all -f $BUILD_PATH/bokeh*.tar.bz2 --quiet
echo "pkgs converted"

# upload conda pkgs to anaconda.org
platforms=(osx-64 linux-64 win-64 linux-32 win-32)
for plat in "${platforms[@]}"
do
    echo Uploading: $plat
    anaconda -t $bintoken upload -u bokeh $plat/bokeh*.tar.bz2 -c $channel --force --no-progress
done

# create, register and upload pypi pkgs to pypi and anaconda.org
# zip is currently not working on anaconda.org
python setup.py $register sdist --formats=gztar,zip $upload
echo "sdist pkg built"
if [[ ! -z "$upload" ]]; then
    echo "I'm done uploading to pypi"
fi

anaconda -t $bintoken upload -u bokeh dist/bokeh*.tar.gz --package-type pypi -c $channel --force --no-progress
echo "I'm done uploading to anaconda.org"

###########################
# JS and CSS into the CDN #
###########################
# get complete version
# Note: we need to get the version here to avoid being bitten by the
# __conda_version__.txt file generated at the first build (by travis_install)
complete_version=$(cat __conda_version__.txt)

# get token
token=`curl -s -XPOST https://identity.api.rackspacecloud.com/v2.0/tokens \
-d'{"auth":{"RAX-KSKEY:apiKeyCredentials":{"username":"'$username'","apiKey":"'$key'"}}}' \
-H"Content-type:application/json" | python -c 'import sys,json;data=json.loads(sys.stdin.read());print(data["access"]["token"]["id"])'`

# get unique url id
id=`curl -s -XPOST https://identity.api.rackspacecloud.com/v2.0/tokens \
-d'{"auth":{"RAX-KSKEY:apiKeyCredentials":{"username":"'$username'","apiKey":"'$key'"}}}' \
-H"Content-type:application/json" | python -c 'import sys,json; data=json.loads(sys.stdin.read()); print([i["endpoints"][0]["tenantId"] for i in data["access"]["serviceCatalog"] if i["name"] == "cloudFiles"][0])'`

# push the main js
curl -XPUT -T bokehjs/build/js/bokeh.js -v -H "X-Auth-Token:$token" -H "Content-Type: application/javascript" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-$complete_version.js";
curl -XPUT -T bokehjs/build/js/bokeh.min.js -v -H "X-Auth-Token:$token" -H "Content-Type: application/javascript" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-$complete_version.min.js";

# push the widgets js files
curl -XPUT -T bokehjs/build/js/bokeh-widgets.js -v -H "X-Auth-Token:$token" -H "Content-Type: application/javascript" \
-H "Origin: https://mycloud.rackspace.com" "https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-widgets-$complete_version.js";
curl -XPUT -T bokehjs/build/js/bokeh-widgets.min.js -v -H "X-Auth-Token:$token" -H "Content-Type: application/javascript" \
-H "Origin: https://mycloud.rackspace.com" "https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-widgets-$complete_version.min.js";

# push the css files
curl -XPUT -T bokehjs/build/css/bokeh.css -v -H "X-Auth-Token:$token" -H "Content-Type: text/css" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-$complete_version.css";
curl -XPUT -T bokehjs/build/css/bokeh.min.css -v -H "X-Auth-Token:$token" -H "Content-Type: text/css" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-$complete_version.min.css";

# push the widgets css files
curl -XPUT -T bokehjs/build/css/bokeh-widgets.css -v -H "X-Auth-Token:$token" -H "Content-Type: text/css" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-widgets-$complete_version.css";
curl -XPUT -T bokehjs/build/css/bokeh-widgets.min.css -v -H "X-Auth-Token:$token" -H "Content-Type: text/css" -H "Origin: https://mycloud.rackspace.com" \
"https://storage101.dfw1.clouddrive.com/v1/$id/bokeh/bokeh/$subdir/bokeh-widgets-$complete_version.min.css";

echo "I'm done uploading to Rackspace"

#########################
# Build and upload Docs #
#########################

pushd sphinx

# being explicit to pass the correct version
# Note: we need to override the version here to avoid being bitten by the
# __version__ used from the first build (by travis_install)
BOKEH_DOCS_CDN=$complete_version BOKEH_DOCS_VERSION=$complete_version make clean all

# to the correct location
if [[ "$travis_build_number" == "release" ]]; then
    fab deploy:$complete_version
    fab latest:$complete_version
    echo "I'm done uploading the release docs"
elif [[ "$travis_build_number" == "devel" ]]; then
    fab deploy:dev
    echo "I'm done uploading the devel docs"
fi

popd

######################
# Publish to npm.org #
######################

pushd bokehjs

if [[ "$travis_build_number" == "release" ]]; then
    npm publish
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
