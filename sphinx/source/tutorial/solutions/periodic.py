from bokeh.plotting import figure, output_file, show
from bokeh.models import HoverTool, ColumnDataSource
from bokeh.sampledata import periodic_table

# categories need to be strings
elements = periodic_table.elements[periodic_table.elements['group'] != "-"]

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

        # these are "categorical coordinates"
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

# create a figure
p = figure(title="Periodic Table", tools="resize,hover",
           x_range=group_range, y_range=period_range,
           plot_width=1200)

# EXERCISE: add a `rect` renderer to display a rectangle at each group and column
# Use group_range for x_range and period_range for y_range.
p.rect("group", "period", 0.9, 0.9, source=source,
       fill_alpha=0.6, color="type_color")

# EXERCISE: we will be setting several of the same properties on the text renderers
# below. Add to this dictionary to set the text alignment to 'left' and the text
# baseline to 'middle'
text_props = {
    "source": source,
    "angle": 0,
    "color": "black",
    "text_align": "left",
    "text_baseline": "middle"
}

# Since text can be interpreted as a data source field name in general, and the
# category names and locations are text, we have to specify the fields a little
# more verbosely with a dictionary, as below
p.text(x=dict(field="symx", units="data"),
       y=dict(field="period", units="data"),
       text=dict(field="sym", units="data"),
       text_font_style="bold", text_font_size="15pt", **text_props)

# EXERCISE: add text that displays the atomic number in each square with 9pt font.
# Use 'numbery' for the y position.
p.text(x=dict(field="symx", units="data"),
       y=dict(field="numbery", units="data"),
       text=dict(field="atomic_number", units="data"),
       text_font_size="9pt", **text_props)

# EXERCISE: add text that displays the full name in each square with 6pt font
# Use 'namey' for the y position.
p.text(x=dict(field="symx", units="data"),
       y=dict(field="namey", units="data"),
       text=dict(field="name", units="data"),
       text_font_size="6pt", **text_props)

# EXERCISE: add text that displays the atomic mass each square in 5pt font
# Use 'massy' for the y position.
p.text(x=dict(field="symx", units="data"),
       y=dict(field="massy", units="data"),
       text=dict(field="mass", units="data"),
       text_font_size="5pt", **text_props)

# turn off the grid lines
p.grid.grid_line_color = None

# EXERCISE: configure a hover tool that displays the following:
# * name
# * atomic number
# * type
# * atomic mass
# * CPK color
# * electronic configuration
hover = p.select(dict(type=HoverTool))
hover.tooltips = [
    ("name", "@name"),
    ("atomic number", "@atomic_number"),
    ("type", "@type"),
    ("atomic mass", "@mass"),
    ("CPK color", "$color[hex, swatch]:cpk"),
    ("electronic configuration", "@electronic"),
]

# EXERCISE: show the plot
show(p)
