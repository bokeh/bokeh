#!/bin/bash

set -x

TARGET_DIR=${TARGET_DIR:-build/target}
DIST_DIR=${PKG:-build/wasm}
TARGET=${TARGET:-wasm32-unknown-unknown}
PROFILE=${PROFILE:-release}
NAME=${NAME:-bokeh_web}

cargo build --${PROFILE} --target ${TARGET}
wasm-bindgen --out-dir=${DIST_DIR} --target=web --weak-refs --omit-default-module-path ${TARGET_DIR}/${TARGET}/${PROFILE}/${NAME}.wasm
wasm-opt -Os ${DIST_DIR}/${NAME}_bg.wasm -o ${DIST_DIR}/${NAME}_bg.wasm
du -hs ${DIST_DIR}/*.wasm
