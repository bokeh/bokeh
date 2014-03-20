from bokeh.plotting import *
from bokeh.sampledata import periodic_table
import pandas as pd

elements = periodic_table.elements
elements = elements[elements['atomic number'] <= 82]
elements = elements[~pd.isnull(elements['melting point'])]
mass = [float(x.strip('[]')) for x in elements['atomic mass']]
elements['atomic mass'] = mass

palette = list(reversed([
    '#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#f7f7f7','#d1e5f0','#92c5de','#4393c3','#2166ac','#053061'
]))

melting_points = elements['melting point']
low = min(melting_points)
high= max(melting_points)
melting_point_inds = [int(10*(x-low)/(high-low)) for x in melting_points] #gives items in colors a value from 0-10
meltingpointcolors = [palette[i] for i in melting_point_inds]

output_file("elements.html", title="elements.py example")

hold()

circle(elements['atomic mass'], elements['density'] ,
       color=meltingpointcolors, plot_width=1200, line_color='black',fill_alpha=0.8,
       size=12, title='Density vs Atomic Weight of Elements (colored by melting point)',
       background_fill= '#cccccc', tools='pan, wheel_zoom, box_zoom, reset')

text(elements['atomic mass'], elements['density'] +0.3,
    text=elements['symbol'],angle=0, text_color='#333333',
    text_align="center", text_font_size="10pt")

xaxis().axis_label='atomic weight (amu)'
yaxis().axis_label='density (g/cm^3)'
grid().grid_line_color='white'

show()
