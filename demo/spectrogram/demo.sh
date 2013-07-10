#!/bin/bash

hem server -d &
python soundserver.py 2> /dev/null

