import pandas as pd
from bokeh.plotting import *
from bokeh.sampledata import periodic_table
from bokeh.objects import HoverTool, ColumnDataSource
from collections import OrderedDict

# categories need to be strings
elements = periodic_table.elements[periodic_table.elements['group'] != "-"]
elements['group'] = [str(x) for x in elements['group']]
elements['period'] = [str(x) for x in elements['period']]

# The categorical ranges need to be strings, so convert the groups and periods
group_range = [str(x) for x in range(1,19)]
period_range = [str(x) for x in reversed(sorted(set(elements['period'])))]

# Output static HTML file
output_file("periodic.html")

# I like this colormap OK, but feel free to change it up
colormap = {
    'alkali metal'         : "#a6cee3",
    'alkaline earth metal' : "#1f78b4",
    'halogen'              : "#fdbf6f",
    'metal'                : "#b2df8a",
    'metalloid'            : "#33a02c",
    'noble gas'            : "#bbbb88",
    'nonmetal'             : "#baa2a6",
    'transition metal'     : "#e08e79",
}

# There are lots of things about each element we might want a hover tool
# to be able to display, so put them all in a ColumnDataSource
source = ColumnDataSource(
    data=dict(
        group=[str(x) for x in elements['group']],
        period=[str(y) for y in elements['period']],
        symx=[str(x)+":0.1" for x in elements['group']],
        numbery=[str(x)+":0.8" for x in elements['period']],
        massy=[str(x)+":0.15" for x in elements['period']],
        namey=[str(x)+":0.3" for x in elements['period']],
        sym=elements['symbol'],
        name=elements['name'],
        cpk=elements['CPK'],
        atomic_number=elements['atomic number'],
        electronic=elements['electronic configuration'],
        mass=elements['atomic mass'],
        type=elements['metal'],
        type_color=[colormap[x] for x in elements['metal']],
    )
)

hold()

# EXERCISE: add a `rect` renderer to display a rectangle at each group and column
# Use group_range for x_range and period_range for y_range. Rememeber to add a
# 'hover' to the tools and make your plot fairly wide.

# EXERCISE: we will be setting several of the same properties on the text renderers
# below. Add to this dictionary to set the text alignment to 'left' and the text
# baseline to 'middle'
text_props = {
    "source": source,
    "angle": 0,
    "color": "black",
}

# Since text can be interpreted as a data source field name in general, we have
# to specify the text a little more verbosely with a dictionary, as below
text(x=dict(field="symx", units="data"),
     y=dict(field="period", units="data"),
     text=dict(field="sym", units="data"),
     text_font_style="bold", text_font_size="15pt", **text_props)

# EXERCISE: add text that displays the atomic number in each square with 9pt font.
# Use 'numbery' for the y position.

# EXERCISE: add text that displays the full name in each square with 6pt font
# Use 'namey' for the y position.

# EXERCISE: add text that displays the atomic mass each square in 5pt font
# Use 'massy' for the y position.

# turn off the grid lines
grid().grid_line_color = None

# EXERCISE: configure a hover tool that displays the following:
# * name
# * atomic number
# * type
# * atomic mass
# * CPK color
# * electronic configuration
hover = [t for t in curplot().tools if isinstance(t, HoverTool)][0]
hover.tooltips = OrderedDict([
    # add to me
])

show()
