#!/usr/bin/env python

from bokeh.plotting import Figure, output_file, show
import datetime
from bokeh.models import HoverTool, DatetimeTickFormatter, ColumnarDataSource, Toggle, BoxAnnotation, CustomJS
from bokeh.layouts import layout
from bokeh.models.widgets import Tabs, Panel
import pandas
import os, glob, io, re


### Concatenating multi data in one csv file.

def concatenate(indir="/Users/mubarak/Desktop/Demo/flow", outfile="/Users/mubarak/Desktop/Demo/Data.csv"):
	os.chdir(indir)
	filelist = glob.glob("*.csv")
	dflist = []
	colnames = ["Id","TypeId","UpBytes","DownBytes","StatTime", "DeviceName"] 
	for filename in filelist:
		df = pandas.read_csv(filename)
		# df = df.drop(df.index[[0]])
		dflist.append(df)
	concatDf = pandas.concat(dflist, axis=0)              
	concatDf.columns = colnames
	concatDf.to_csv(outfile, index=0)	

	print "--- Data concatenated ---"

## Read the concatenated data from above function and drow bokeh graphs.

def run_graph():
	
	df = pandas.read_csv("Data.csv", parse_dates=["StatTime"])
	df = df.sort_values(by='StatTime')
	df2 = df[~(df['UpBytes'] <= 1)]
	df3 = df2[~(df2['DownBytes'] <= 1)]
	
	result = df.groupby(['DeviceName','StatTime','TypeId'], as_index = False)['UpBytes', 'DownBytes'].sum()

	p = Figure(width=500, height=250,logo =None, 
		sizing_mode='scale_width', 
		tools="pan, box_zoom, wheel_zoom, save, reset, box_select",
		x_axis_type="datetime",
		title="Device Traffic Utilization Graph:", 
		x_axis_label="Time Frame", 
		y_axis_label="Traffic Utilization (GB)",
		toolbar_location="below",
		toolbar_sticky=False)

	p.xaxis.formatter = DatetimeTickFormatter(seconds=["%H:%M"],
                                            minutes=["%H:%M"],
                                            minsec=["%H:%M"],     # format the time from timestamp to readable time.
                                            hours=["%H:%M"])


	timeFrame = result["StatTime"]
	upbyte = result["UpBytes"]
	downbyte = result["DownBytes"]
	devicename = result["DeviceName"].astype(str)
	typeid = result["TypeId"]
	

	timeconv  = pandas.to_datetime(timeFrame, unit='s')
	convnumb = upbyte / 1024 ** 3
	
	x = str(convnumb)
	cisco = result[(result.DeviceName == 'cisco_device') & (result.TypeId == 2915)]
	cisco_up = cisco["UpBytes"] / 1024 ** 3														#youtube_ssl = cisco
	cisco_down = cisco["DownBytes"] / 1024 ** 3
	cisco_conv = cisco["StatTime"]
	cisco_time = pandas.to_datetime(cisco_conv, unit='s') 
	
	hp = result[(result.DeviceName == 'Hp') & (result.TypeId == 932)]
	hp_up = hp["UpBytes"] / 1024 ** 3
	hp_down = hp["DownBytes"] / 1024 ** 3														#whatsapp = hp
	hpconv = hp["StatTime"]
	hp_time = pandas.to_datetime(hpconv, unit='s')
	
	dell = result[(result.DeviceName == 'Dell') & (result.TypeId == 469)]
	dell_up = dell["UpBytes"] / 1024 ** 3
	dell_down = dell["DownBytes"] / 1024 ** 3														#facebook = dell
	dellconv = dell["StatTime"]
	dell_time = pandas.to_datetime(dellconv, unit='s')

	dell_2 = result[(result.DeviceName == 'Dell_2') & (result.TypeId == 2758)]
	dell_2_up = dell_2["UpBytes"] / 1024 ** 3												#facebook_video dell_2
	dell_2_down = dell_2["DownBytes"] / 1024 ** 3
	dell_2_con = dell_2["StatTime"]
	dell_2_time = pandas.to_datetime(dell_2_con, unit='s')

	juniper = result[(result.DeviceName == 'juniper') & (result.TypeId == 1234)]
	juniper_up = juniper["UpBytes"] / 1024 ** 3
	juniper_down = juniper["DownBytes"] / 1024 ** 3														#Instegram juniper
	juniperconv = juniper["StatTime"]
	juniper_time = pandas.to_datetime(juniperconv, unit='s')



	
	
	####<<<<<<<< Bokeh - plotting - Section >>>>>>>#####

	p.multi_line(juniper_time, juniper_up, color='#2828B0', line_width=1, legend='UpBytes')
	p.multi_line(juniper_time, juniper_down, color='#EE0091', line_width=1, legend='DownBytes')
	
	hover = HoverTool(tooltips = [('Time', '@x{int}'),   #show the x current time.
                             ('Value', '@y{1.11} GB'),   #show the UpByte and DownByte.
                             ('Device', '@DeviceName')]) 
	
	hover.formatters = {"Date": "datetime"}
	p.legend.label_text_font = "times"
	p.legend.label_text_font_style = "italic"
	
	p.grid.grid_line_alpha=0.5
	p.xaxis.major_tick_line_width = 3
	p.xaxis.minor_tick_line_color = "navy"
	
	p.add_tools(hover)
	

	output_file("/Users/mubarak/Desktop/Demo/plotting.html", title="Device_Reports")
	print "Fetching data compeleted!!"
 	show(p)

concatenate()
run_graph()