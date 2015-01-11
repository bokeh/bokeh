#!/bin/sh
python sample_data/create_tweets_file.py &
PID1=$!
python ../../bokeh-server --backend memory &
PID2=$!
SLEEP 3
python ../../bokeh-cli --title "Bokeh Tweets" --series "lon" --index "lat" --chart_type "scatter" --input "sample_data/sim_tweets.csv" --output server://tweetsdemo --sync_with_source t "$@"
trap 'kill $PID1 $PID2' EXIT

