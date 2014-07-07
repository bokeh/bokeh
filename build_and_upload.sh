#!/bin/bash

if [ "$1" == "-h" ]; then
    usage="$(basename "$0") [-h] [--tags] -- program to build and upload bokeh pkgs to binstar

    where:
        -h  show this help text
        --tags instructs the version number to be the tagged branch
    "
    echo "$usage"
    exit 0
elif [ "$1" == "--tags" ]; then
    tag_flag=1

    #needed for build.sh in conda build script
    touch using_tags.txt
else
    tag_flag=0
fi
echo The tag flag: $tag_flag

#buld py27 pkg
echo "Building py27 pkg"
conda build conda.recipe --quiet;

#buid py33 pkg
echo "Building py33 pkg"
CONDA_PY=33 conda build conda.recipe --quiet;

#buid py34 pkg
echo "Building py34 pkg"
CONDA_PY=34 conda build conda.recipe --quiet;

CONDA_ENV=`conda info --json | jsawk 'return this.root_prefix'`
PLATFORM=`conda info --json | jsawk 'return this.platform'`
BUILD_PATH=$CONDA_ENV/conda-bld/$PLATFORM

#echo build path: $BUILD_PATH
date=`date "+%Y%m%d"`

conda convert -p all -f $BUILD_PATH/bokeh*$date*.tar.bz2;

#upload conda pkgs to binstar
array=(osx-64 linux-64 win-64 linux-32 win-32)
for i in "${array[@]}"
do
    echo Uploading: $i;
	binstar upload -u bokeh $i/bokeh*$date*.tar.bz2 -c dev --force;
done

if [ "$tag_flag" = "1" ]; then
    version=`git describe`
else
    version=`python build_scripts/get_bump_version.py`
fi

#create and upload pypi pkgs to binstar

#zip is currently not working

BOKEH_DEV_VERSION=$version.dev.$date python setup.py sdist --formats=gztar
binstar upload -u bokeh dist/bokeh*$date* --package-type pypi -c dev --force;

echo "I'm done uploading"

#clean up
for i in "${array[@]}"
do
    rm -rf $i
done

rm -rf dist/
rm using_tags.txt

#####################
#Removing on binstar#
#####################


# remove entire release
# binstar remove user/package/release
# binstar --verbose remove bokeh/bokeh/0.4.5.dev.20140602

# remove file
# binstar remove user[/package[/release/os/[[file]]]]
# binstar remove bokeh/bokeh/0.4.5.dev.20140602/linux-64/bokeh-0.4.5.dev.20140602-np18py27_1.tar.bz2

# show files
# binstar show user[/package[/release/[file]]]
# binstar show bokeh/bokeh/0.4.5.dev.20140604
