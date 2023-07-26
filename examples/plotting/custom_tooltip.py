''' A plot of periodic table elements using a Periodic table dataset.
This example demonstrates the use of custom css tooltips when creating plots.
The chart shows correlation between atomic mass and density of periodic table
elements.

.. bokeh-example-metadata::
    :sampledata: periodic_table
    :apis: bokeh.plotting.figure
    :refs: :ref:`ug_interaction_tooltips`
    :keywords: plot, tooltips, custom

'''

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
    type_color=[colormap[x] for x in elements["metal"]],
)

TOOLTIPS = """
    <div style="opacity: 0.8; padding: 0.5em; background-color: @type_color;">
        <div style="font-size: 12px;">@atomic_number</div>
        <div style="font-size: 24px;"><strong>@sym</strong></div>
        <div style="font-size: 8px;"><strong>@name</strong></div>
        <div style="font-size: 8px;">@atomic_mass{0.00}</div>
    </div>
"""

p = figure(width=900, height=450, tooltips=TOOLTIPS, title='Densities by Atomic Mass')
p.background_fill_color = "#fafafa"

p.scatter('atomic_mass', 'density', size=12, source=data, color='type_color',
          line_color="black", legend_field='metal', alpha=0.9)

p.legend.glyph_width = 30
p.legend.glyph_height = 30
p.xaxis.axis_label= 'Atomic Mass'
p.yaxis.axis_label= 'Density'
p.xgrid.grid_line_color = None
p.toolbar_location = None

legend = p.legend[0]
p.add_layout(legend, 'right')
legend.border_line_color = None

show(p)
