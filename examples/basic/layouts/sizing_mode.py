from bokeh.core.enums import SizingMode
from bokeh.layouts import column, row
from bokeh.models import Div, Select
from bokeh.plotting import figure, show
from bokeh.sampledata.penguins import data
from bokeh.transform import factor_cmap

p = figure(sizing_mode="fixed")

p.scatter("flipper_length_mm", "body_mass_g", source=data, fill_alpha=0.4, size=12,
          color=factor_cmap('species', 'Category10_3', data.species.unique()))

div = Div(text="Select a sizing mode to see how a plot resizes inside a parent container.")

select = Select(title="Sizing mode", value="fixed", options=list(SizingMode), width=300)
select.js_link('value', p, 'sizing_mode')

container = row(p, height=800, sizing_mode="stretch_width")
container.stylesheets.append(":host { border: 10px solid grey; }")

layout = column(div, select, container)
layout.sizing_mode = "stretch_both" # set separately to avoid also setting children

show(layout)
