#!/bin/bash

set -x #echo on

pushd bokehjs
node make build
popd
tar czf bokehjs-build.tgz "bokehjs/build"
