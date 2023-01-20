#!/bin/bash

set -x

TARGET=${TARGET:-wasm32-unknown-unknown}
PROFILE=${PROFILE:-release}
NAME=${NAME:-bokeh_web}
DIST=${DIST:-dist}

cargo build --${PROFILE} --target ${TARGET}
wasm-bindgen --out-dir=${DIST} --target=web --weak-refs --omit-default-module-path target/${TARGET}/${PROFILE}/${NAME}.wasm
wasm-opt -Os ${DIST}/${NAME}_bg.wasm -o ${DIST}/${NAME}_bg.wasm
du -hs ${DIST}/*.wasm
