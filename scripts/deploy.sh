#!/bin/bash

# a simple help
if [ "$1" == "-h" ]; then
    usage="$(basename "$0") [-h] -- program to trigger the deployment of devel/rc and release pkgs

    where:
        -h     show this help text
        -d     dev build tag in the form X.X.X[dev]/[rc]number, ie: 0.10.0dev1
        -p     previous tag in the form X.X.X (for releases)
        -r     proposed new tag in the form X.X.X (for releases)
    "
    echo "$usage"
    exit 0
fi

# option management
while getopts d:p:r: option
do
    case "${option}" in
        d) dtag=${OPTARG};;
        p) ptag=${OPTARG};;
        r) rtag=${OPTARG};;
    esac
done

# main
if [[ -z "$dtag" && ! -z "$ptag" && ! -z "$rtag" ]]; then
    echo "You have triggered a full release for $rtag"
    tag=$rtag

elif [[ ! -z "$dtag" && ! -z "$ptag" && -z "$rtag" ]]; then
    echo "You have triggered a dev/rc build for $dtag"
    tag=$dtag

else
    echo "You must pass either -d <tag> -p <tag> OR -r <tag> -p <tag>"
    echo "Run ./deploy.sh -h for help."
    exit 0
fi

# create a new branch
git checkout -b release_$tag

# update BokehJS versions strings
python update_bokehjs_versions.py $tag
git add ../bokehjs/package.json
git add ../bokehjs/src/coffee/version.coffee
git commit -m "Update software version strings to $tag."

# update documentation versions and CHANGELOG on full releases
if [[ ! -z "$rtag" ]]; then
    python update_docs_versions.py $tag
    git add ../sphinx/source/all_versions.txt
    git add ../sphinx/source/index.rst
    git commit -m "Adding release $tag to documentation."

    python issues.py -p $ptag -r $tag
    ret=$?
    if [ $ret -ne 0 ]; then
        echo "Exiting because CHANGELOG generation failed."
        echo "Check you actually have a ../sphinx/source/docs/releases/<tag>/.rst file."
        exit 1
    fi
    git add ../CHANGELOG
    git commit -m "Updating CHANGELOG."
fi

# Merge branch into master and push to origin
git checkout master
git pull origin
git merge --no-ff release_$tag -m "Merge branch release_$tag"
git push origin master
git branch -d release_$tag

git tag -a $tag -m "Release $tag".
git push origin $tag
