#!/bin/bash

COMMAND="cd /bokeh/bokehjs && node gulpfile.js $1"

source "$(dirname $0)/base.sh"
