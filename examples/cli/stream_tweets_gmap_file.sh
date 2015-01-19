#!/bin/sh
python sample_data/create_tweets_file.py &
PID1=$!
SLEEP 3
python ../../bokeh-cli --title "Bokeh Tweets" --series "lon" --index "lat" --map "30.26,-97.74" --chart_type "gmap,scatter" --input "sample_data/sim_tweets.csv" --output file://tweets_map.html "$@"
trap 'kill $PID1' EXIT

