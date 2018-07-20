#!/bin/bash

set -e # exit on error
set -x # echo commands

py.test -s -m js
