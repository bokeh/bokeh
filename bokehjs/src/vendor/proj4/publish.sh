#!/bin/bash

# get current version
VERSION=$(npm ls --json=true proj4js | grep version | awk '{ print $2}'| sed -e 's/^"//'  -e 's/"$//')

# Build
git checkout -b build
grunt
git add dist -f
git commit -m "build $VERSION"

# Tag and push
git tag $VERSION
git push --tags git@github.com:proj4js/proj4js.git $VERSION

# Publish
npm publish
jam publish

# Cleanup
git checkout master
git branch -D build