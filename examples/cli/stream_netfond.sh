#!/bin/sh
python ../../bokeh-cli --title "My Nice Plot" --series "bid" --chart_type "timeseries" --input "http://hopey.netfonds.no/posdump.php?paper=AAPL.O&csv_format=csv" --index time --output server://clistockdemo1 --sync_with_source t
