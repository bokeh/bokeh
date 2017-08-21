#!/bin/bash

COMMAND="cd /bokeh && pytest $1"

source "$(dirname $0)/base.sh"
