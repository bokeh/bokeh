#!/bin/bash

# a simple help
if [ "$1" == "-h" ]; then
    usage="$(basename "$0") [-h] [-t] -- program to trigger the deployment of devel/rc builds

    where:
        -h     show this help text
        -t     the tag in the form X.X.Xdev[rc] for dev/rc builds
    "
    echo "$usage"
    exit 0
fi

# option management
while getopts t: option;
do
    case "${option}" in
        t) tag=${OPTARG};;
    esac 
done

# check we are actually pasing a tag
if [[ -z "$tag" ]]; then
    echo "Please provide a tag in the form X.X.Xdev[rc]."
    exit 0
else
    echo "The tag you provide was" $tag
fi

# get the HEAD commit hash
commit=`git rev-parse --short HEAD`
completetag=$tag-$commit
echo "The complete tag will be" $completetag

# and tag it locally
git tag -a $completetag -m "New devel[rc] build tag."
echo "The complete tag was pushed to origin."

# and push the tag
git push origin $completetag
echo "The new devel build was triggered."
