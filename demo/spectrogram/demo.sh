#!/bin/bash

hem server -d &
echo
echo     Point your web browser to http://localhost:5000
echo     then make noises and whistle into your microphone
echo
python soundserver.py 2> /dev/null

