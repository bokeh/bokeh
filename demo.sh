#!/bin/bash

hem server -d -s slug.all.json &
echo
echo Please open a web browser to http://localhost:5000
echo
python demoserver.py debug

