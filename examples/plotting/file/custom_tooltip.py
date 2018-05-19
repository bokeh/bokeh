import pandas as pd

from bokeh.plotting import figure, show
from bokeh.sampledata.periodic_table import elements

elements = elements.copy()
elements = elements[elements.group != "-"]
elements.sort_values('metal', inplace=True)

colormap = {
    "alkali metal"         : "#a6cee3",
    "alkaline earth metal" : "#1f78b4",
    "halogen"              : "#fdbf6f",
    "metal"                : "#b2df8a",
    "metalloid"            : "#33a02c",
    "noble gas"            : "#bbbb88",
    "nonmetal"             : "#baa2a6",
    "transition metal"     : "#e08e79",
}

data=dict(
    atomic_number=elements["atomic number"],
    sym=elements["symbol"],
    name=elements["name"],
    atomic_mass = pd.to_numeric(elements['atomic mass'], errors="coerce"),
    density=elements['density'],
    metal=[x.title() for x in elements["metal"]],
    type_color=[colormap[x] for x in elements["metal"]]
)

mass_format = '{0.00}'

TOOLTIPS = """
    <div style="width: 62px; height: 62px; opacity: .8; padding: 5px; background-color: @type_color;>
    <h1 style="margin: 0; font-size: 12px;"> @atomic_number </h1>
    <h1 style="margin: 0; font-size: 24px;"><strong> @sym </strong></h1>
    <p style=" margin: 0; font-size: 8px;"><strong> @name </strong></p>
    <p style="margin: 0; font-size: 8px;"> @atomic_mass{mass_format} </p>
    </div>
""".format(mass_format=mass_format)

p = figure(plot_width=900, plot_height=450, tooltips=TOOLTIPS, title='Densities by Atomic Mass')
p.circle('atomic_mass', 'density', size=12, source=data, color='type_color',
         line_color="black", legend='metal', fill_alpha=0.9)

p.xaxis.axis_label= 'Atomic Mass'
p.yaxis.axis_label= 'Density'
p.grid.grid_line_color = None
p.toolbar_location = None

l = p.legend[0]
l.plot = None
p.add_layout(l, 'right')
l.border_line_color = None

show(p)
