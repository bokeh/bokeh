#!/bin/bash

# CLI user interface
if [ "$1" == "-h" ]; then
    usage="$(basename "$0") [-h] -- program to build and upload bokeh pkgs to binstar

    where:
        -h     show this help text

        -b     Binstar token
        -c     whether to clean the built packages, defaults to true
    "
    echo "$usage"
    exit 0
fi

# defauls
clean=true

# handling of arguments
while getopts b:c: option;
do
    case "${option}" in
        b) bintoken=${OPTARG};;
        c) clean=${OPTARG};;
    esac 
done

# get binstar token from env variable if it is not provided with args
if [ "$bintoken" == "" ]; then
    bintoken=$BOKEH_DEVEL_TOKEN
    echo "$bintoken"
fi

# build for each python version
for py in 27 33 34;
do
    echo "Building py$py pkg"
    CONDA_PY=$py conda build conda.recipe --quiet
done

# get conda info about root_prefix and platform
function conda_info {
    conda info --json | python -c "import json, sys; print(json.load(sys.stdin)['$1'])"
}

CONDA_ENV=$(conda_info root_prefix)
PLATFORM=$(conda_info platform)
BUILD_PATH=$CONDA_ENV/conda-bld/$PLATFORM

# get travis_build_id
travis_build_id=$(cat __travis_build_id__.txt)

# convert to platform-specific builds
conda convert -p all -f $BUILD_PATH/bokeh*$travis_build_id*.tar.bz2 --quiet;

# upload conda pkgs to binstar
array=(osx-64 linux-64 win-64 linux-32 win-32)
for i in "${array[@]}"
do
    echo Uploading: $i;
    binstar -t $bintoken upload -u bokeh scripts/$i/bokeh*$travis_build_id*.tar.bz2 --force --no-progress;
done

# create and upload pypi pkgs to binstar
# zip is currently not working

python setup.py sdist --formats=gztar
binstar -t $bintoken upload -u bokeh dist/bokeh*$travis_build_id* --package-type pypi --force --no-progress;

echo "I'm done uploading to binstar"

########################
#   General clean up   #
########################

# clean up platform folders
if [ $clean == true ]; then
    for i in "${array[@]}"
    do
        rm -rf $i
    done
    rm -rf dist/
else
    echo "Not cleaning the packages."
fi

# clean up the additional building stuff (useful if you are doing it locally)
rm -rf build/
rm -rf bokeh.egg-info/
rm -rf record.txt
rm -rf versioneer.pyc
rm -rf __conda_version__.txt
rm -rf bokeh/__conda_version__.py
rm -rf bokeh/__conda_version__.pyc
rm -rf bokeh/__pycache__/__conda_version__.pyc

