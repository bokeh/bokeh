#!/bin/sh
python ../../bokeh-server --backend memory &
PID1=$!
SLEEP 3
python ../../bokeh-cli --title "Bokeh Tweets" --series "lon" --index "lat" --map "30.315,-97.872" --chart_type "scatter" --input "sample_data/sim_tweets.csv" --output server://smartfiltersdemo --smart_filters "$@"
trap 'kill $PID1' EXIT

