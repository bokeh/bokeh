#!/bin/bash

set -x

TARGET_DIR=${TARGET_DIR:-build/target}
DIST_DIR=${PKG:-build/wasm}
TARGET=${TARGET:-wasm32-unknown-unknown}
PROFILE=${PROFILE:-release}
NAME=${NAME:-bokeh_web}

WASM=${TARGET_DIR}/${TARGET}/${PROFILE}/${NAME}.wasm
WASM_BG=${DIST_DIR}/${NAME}_bg.wasm

cargo build --${PROFILE} --target ${TARGET}
wasm-bindgen --out-dir=${DIST_DIR} --target=web --reference-types --weak-refs --omit-default-module-path ${WASM}
wasm-opt -Os --enable-reference-types ${WASM_BG} -o ${WASM_BG}
du -hs --apparent-size ${WASM_BG}
