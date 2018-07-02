from bokeh.plotting import Figure, output_file, show
import datetime
from bokeh.models import HoverTool, DatetimeTickFormatter, ColumnarDataSource, Toggle, BoxAnnotation, CustomJS
from bokeh.layouts import layout
from bokeh.models.widgets import Tabs, Panel
import pandas
import os, glob, io, re


df = pandas.read_csv("Data.csv", parse_dates=["StatTime"])
df = df.sort_values(by='StatTime')
df2 = df[~(df['UpBytes'] <= 1)]
df3 = df2[~(df2['DownBytes'] <= 1)]
result = df.groupby(['DeviceName','StatTime','TypeId'], as_index = False)['UpBytes', 'DownBytes'].sum()

p = Figure(
	width=500, height=250,
	logo =None,sizing_mode='scale_width',
	tools="pan, box_zoom, wheel_zoom, save, reset, box_select",
	x_axis_type="datetime",title="Device Traffic Utilization Graph:",
	x_axis_label="TimeFrame",y_axis_label="Traffic Utilization (GB)",
	toolbar_location="below",toolbar_sticky=False)
p.xaxis.formatter = DatetimeTickFormatter(seconds=["%H:%M"],
                                           minutes=["%H:%M"],
                                           minsec=["%H:%M"],
                                           hours=["%H:%M"])
timeFrame = result["StatTime"]
upbyte = result["UpBytes"]
downbyte = result["DownBytes"]
devicename = result["DeviceName"].astype(str)
typeid = result["TypeId"]

timeconv  = pandas.to_datetime(timeFrame, unit='s')
convnumb = upbyte

x = str(convnumb)
cisco = result[(result.DeviceName == 'cisco_device') & (result.TypeId == 2915)]
cisco_up = cisco["UpBytes"]
cisco_down = cisco["DownBytes"]
cisco_conv = cisco["StatTime"]
cisco_time = pandas.to_datetime(cisco_conv, unit='s') 

hp = result[(result.DeviceName == 'Hp') & (result.TypeId == 932)]
hp_up = hp["UpBytes"]
hp_down = hp["DownBytes"]
hpconv = hp["StatTime"]
hp_time = pandas.to_datetime(hpconv, unit='s')

dell = result[(result.DeviceName == 'Dell') & (result.TypeId == 469)]
dell_up = dell["UpBytes"]
dell_down = dell["DownBytes"]
dellconv = dell["StatTime"]
dell_time = pandas.to_datetime(dellconv, unit='s')

dell_2 = result[(result.DeviceName == 'Dell_2') & (result.TypeId == 2758)]
dell_2_up = dell_2["UpBytes"]
dell_2_down = dell_2["DownBytes"] 
dell_2_con = dell_2["StatTime"]
dell_2_time = pandas.to_datetime(dell_2_con, unit='s')

juniper = result[(result.DeviceName == 'juniper') & (result.TypeId == 1234)]
juniper_up = juniper["UpBytes"]
juniper_down = juniper["DownBytes"]
juniperconv = juniper["StatTime"]
juniper_time = pandas.to_datetime(juniperconv, unit='s')

p.multi_line(xs = [juniper_time, juniper_time], ys = [juniper_up, juniper_down] color=['red', 'blue'] line_width=1, legend='juniper')
p.multi_line(xs = [cisco_time, cisco_time], ys = [cisco_up, cisco_down], color=['#EE0091','#2828B0'], line_width=1, legend='cisco')
p.multi_line(xs = [hp_time, hp_time], ys = [hp_up, hp_down], color=['yellow','green'], line_width=1, legend='cisco')
p.multi_line(xs = [cisco_time, cisco_time], ys = [cisco_up, cisco_down], color=['pink','black'], line_width=1, legend='cisco')
p.multi_line(xs = [cisco_time, cisco_time], ys = [cisco_up, cisco_down], color=['#498ABF','#2F00E1'], line_width=1, legend='cisco')

hover = HoverTool(tooltips = [('Time', '@x{int}'),
                            ('Value', '@y{1.11} GB'),
                            ('Device', '@DeviceName')])

hover.formatters = {"Date": "datetime"}
p.legend.label_text_font = "times"
p.legend.label_text_font_style = "italic"

p.grid.grid_line_alpha=0.5
p.xaxis.major_tick_line_width = 3
p.xaxis.minor_tick_line_color = "navy"

p.add_tools(hover)

output_file("plotting.html", title="Device_Reports")
show(p)
