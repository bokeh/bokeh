#!/bin/sh
python ../../bokeh-server --backend memory &
PID1=$!
SLEEP 1
python ../../bokeh-cli --title "My Nice Plot" --series "bid" --chart_type "timeseries" --input "http://hopey.netfonds.no/posdump.php?paper=AAPL.O&csv_format=csv" --index time --output server://clistockdemo1 --sync_with_source t "$@"
trap 'kill $PID1' EXIT
