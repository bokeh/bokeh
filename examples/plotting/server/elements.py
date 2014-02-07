from bokeh.plotting import *
from bokeh.sampledata import periodic_table


elements = periodic_table.elements

palette = list(reversed([
    '#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#f7f7f7','#d1e5f0','#92c5de','#4393c3','#2166ac','#053061'
]))

melting_points = elements['Melting Point']
low = min(melting_points)
high= max(melting_points)
melting_point_inds = [int(10*(x-low)/(high-low)) for x in melting_points] #gives items in colors a value from 0-10
meltingpointcolors = [palette[i] for i in melting_point_inds]

output_server("elements")

hold()

circle(elements['Atomic Mass'], elements['Density'] ,
       color=meltingpointcolors, plot_width=1200, line_color='black',fill_alpha=0.8,
       size=12, title='Density vs Atomic Weight of Elements (colored by melting point)',
       background_fill= '#cccccc', tools='pan, wheel_zoom, box_zoom, reset')

text(elements['Atomic Mass'], elements['Density'] +0.3,
    text=elements['Symbol'],angle=0, text_color='#333333',
    text_align="center", text_font_size="10pt")

xaxis().axis_label='atomic weight (amu)'
yaxis().axis_label='density (g/cm^3)'
grid().grid_line_color='white'

show()