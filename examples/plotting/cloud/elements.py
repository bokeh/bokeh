# -*- coding: utf-8 -*-
"""
Created on Wed Feb  5 12:47:36 2014

@author: RADICAL
"""
from bokeh.plotting import *
import numpy as np
import pandas as pd
#elements = pd.read_csv("elements.csv")
from bokeh.sampledata import periodic_table
elements = periodic_table.elements
output_file("plot_sim.html")
colors=elements['Melting Point'] 
low = min(colors)
high= max(colors)
flat_colors = [int(10*(x-low)/(high-low)) for x in colors] #gives items in colors a value from 1-11 
colorlist=list(reversed(['#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#f7f7f7','#d1e5f0','#92c5de','#4393c3','#2166ac','#053061']))
meltingpointcolors = [colorlist[x] for x in flat_colors]

circle(elements['Atomic Mass'], elements['Density'] ,
       color=meltingpointcolors, plot_width=1200, line_color='black',fill_alpha=0.8,
       size=12, title='Density vs Atomic Weight of Elements (colored by melting point)', background_fill= '#cccccc', tools='pan, wheel_zoom, box_zoom, reset')
       
hold()
text(elements['Atomic Mass'], elements['Density'] +0.3 ,text=elements['Symbol'],angle=0, text_color='#333333',  text_align="center", text_font_size="10pt")
xaxis().axis_label='atomic weight (amu)'
yaxis().axis_label='density (g/cm^3)'
grid().grid_line_color='white'
output_cloud("elements")
show()