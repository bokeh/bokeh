#!/bin/bash

# CLI user interface
if [ "$1" == "-h" ]; then
    usage="$(basename "$0") [-h] -- program to build and upload bokeh pkgs to binstar

    where:
        -h     show this help text

        -b     Binstar token
        -u     RackSpace username
        -k     RackSpace APIkey
        -c     whether to clean the built packages, defaults to true
    "
    echo "$usage"
    exit 0
fi

# defauls
clean=true

# handling of arguments
while getopts b:u:k:c: option;
do
    case "${option}" in
        b) bintoken=${OPTARG};;
        u) username=${OPTARG};;
        k) key=${OPTARG};;
        c) clean=${OPTARG};;
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

# remove first bokeh build to avoid posterior upload
first_build_loc=$BUILD_PATH/bokeh*.tar.bz2
rm -rf $first_build_loc
echo "Removing first bokeh build at $first_build_loc"

# build for each python version
for py in 27 33 34;
do
    echo "Building py$py pkg"
    CONDA_PY=$py conda build conda.recipe --quiet
done

# get travis_build_id
travis_build_id=$(cat __travis_build_id__.txt)

# convert to platform-specific builds
conda convert -p all -f $BUILD_PATH/bokeh*$travis_build_id*.tar.bz2; # --quiet option will be available soon

# upload conda pkgs to binstar
platforms=(osx-64 linux-64 win-64 linux-32 win-32)
for plat in "${platforms[@]}"
do
    echo Uploading: $plat;
    if [[ -z "$travis_build_id" ]]; then
        # for releases we need to upload to the main channel
        binstar -t $bintoken upload -u bokeh $plat/bokeh*$travis_build_id*.tar.bz2 --force --no-progress;
    else
        # for devel builds we need to upload to the dev channel
        binstar -t $bintoken upload -u bokeh $plat/bokeh*$travis_build_id*.tar.bz2 -c dev --force --no-progress;
    fi
done

# create and upload pypi pkgs to binstar
# zip is currently not working
python setup.py sdist --formats=gztar

if [[ -z "$travis_build_id" ]]; then
    # for releases we need to upload to the main channel
    binstar -t $bintoken upload -u bokeh dist/bokeh*$travis_build_id* --package-type pypi --force --no-progress;
else
    # for devel builds we need to upload to the dev channel
    binstar -t $bintoken upload -u bokeh dist/bokeh*$travis_build_id* --package-type pypi -c dev --force --no-progress;
fi

echo "I'm done uploading to binstar"

# upload js and css to the cdn
# get token
token=`curl -s -XPOST https://identity.api.rackspacecloud.com/v2.0/tokens \
-d'{"auth":{"RAX-KSKEY:apiKeyCredentials":{"username":"'$username'","apiKey":"'$key'"}}}' \
-H"Content-type:application/json" | python -c 'import sys,json;data=json.loads(sys.stdin.read());print(data["access"]["token"]["id"])'`

# get unique url id
id=`curl -s -XPOST https://identity.api.rackspacecloud.com/v2.0/tokens \
-d'{"auth":{"RAX-KSKEY:apiKeyCredentials":{"username":"'$username'","apiKey":"'$key'"}}}' \
-H"Content-type:application/json" | python -c 'import sys,json;data=json.loads(sys.stdin.read());print(data["access"]["serviceCatalog"][-1]["endpoints"][0]["tenantId"])'`

# get complete version
complete_version=$(cat __conda_version__.txt)

# get subdirectory to upload
if [[ -z "$travis_build_id" ]]; then
    subdir=release
else
    subdir=dev
fi

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

# upload devel docs
pushd sphinx
make clean all
fab update:dev
popd

echo "I'm done uploading the devel docs"

########################
#   General clean up   #
########################

# clean up platform folders
# if [ $clean == true ]; then
#     for plat in "${platforms[@]}"
#     do
#         rm -rf $plat
#     done
#     rm -rf dist/
# else
#     echo "Not cleaning the packages."
# fi

# clean up the additional building stuff (useful if you are doing it locally)
# rm -rf build/
# rm -rf bokeh.egg-info/
# rm -rf record.txt
# rm -rf versioneer.pyc
# rm -rf __conda_version__.txt
# rm -rf bokeh/__conda_version__.py
# rm -rf bokeh/__conda_version__.pyc
# rm -rf bokeh/__pycache__/__conda_version__.pyc

########################
#Removing from binstar #
########################

# remove entire release
# binstar remove user/package/release
# binstar --verbose remove bokeh/bokeh/0.4.5.dev.20140602

# remove file
# binstar remove user[/package[/release/os/[[file]]]]
# binstar remove bokeh/bokeh/0.4.5.dev.20140602/linux-64/bokeh-0.4.5.dev.20140602-np18py27_1.tar.bz2

# show files
# binstar show user[/package[/release/[file]]]
# binstar show bokeh/bokeh/0.4.5.dev.20140604
