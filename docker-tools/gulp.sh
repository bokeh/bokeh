#!/bin/bash

COMMAND="export PATH=\$PATH:/bokeh/bokehjs/node_modules/.bin && cd /bokeh/bokehjs && gulp $1"

source "$(dirname $0)/base.sh"
