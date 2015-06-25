#!/bin/bash

# a simple help
if [ "$1" == "-h" ]; then
    usage="$(basename "$0") [-h] -- program to trigger the deployment of devel/rc and release pkgs

    where:
        -h     show this help text
        -d     devel build tag in the form X.X.Xdev[rc]
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
    echo "You have triggered the release process"

    # create a new branch
    git checkout -b release_$rtag

    # version number updates
    python version_update.py $rtag
    git add ../.
    git commit -m "Updating bokehjs version to $rtag."

    # CHANGELOG generation
    python issues.py -p $ptag -r $rtag
    ret=$?
    if [ $ret -ne 0 ]; then
        echo "Exiting because CHANGELOG generation failed."
        echo "Check you actually have a ../sphinx/source/docs/releases/<tag>/.rst file."
        exit 1
    fi
    git add ../.
    git commit -m "Updating CHANGELOG."

    # Merge branch into master and push to origin
    git checkout master
    git pull origin
    git merge --no-ff release_$rtag -m "Merge branch release_$rtag"
    git push origin master
    git branch -d release_$rtag

    git tag -a $rtag -m "Release $rtag".
    git push origin $rtag

elif [[ ! -z "$dtag" && -z "$ptag" && -z "$rtag" ]]; then
    echo "You have triggered the devel build process"

    # get the HEAD commit hash
    commit=`git rev-parse --short HEAD`
    completetag=$dtag-$commit
    echo "The complete devel[rc] tag will be" $completetag

    # and tag it locally
    git tag -a $completetag -m "New devel[rc] build $completetag."

    # and push the tag
    git push origin $completetag
    echo "The new devel build was triggered."

else
    echo "You have to pass a -d tag (dev build) OR -p and -r tags (for releases)."
    echo "Run ./deploy.sh -h to get some more help with the args to pass."
    exit 0
fi
