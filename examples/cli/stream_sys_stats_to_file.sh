#!/bin/sh
python sample_data/profile_system.py &
PID1=$!
python ../../bokeh-server --backend memory &
PID2=$!
SLEEP 3
python ../../bokeh-cli --title "CPU STATS" --series "CPU_1,CPU_3" --chart_type "line" --input "sample_data/sys_stats.csv" --output server://clisysdemo --sync_with_source t "$@"
trap 'kill $PID1 $PID2' EXIT
