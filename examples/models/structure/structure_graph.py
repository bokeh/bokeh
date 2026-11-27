''' Visualize the model relationships in a simple Bokeh line plot.

.. bokeh-example-metadata::
    :title: Structure graph
    :keywords: structure graph, models
    :apis: bokeh.plotting.figure.line
'''

from bokeh.io import show
from bokeh.layouts import column, row
from bokeh.models import Div, LabelSet
from bokeh.models.util import generate_structure_plot
from bokeh.plotting import figure

plot = figure(title="Example line plot", width=300, height=190, toolbar_location=None, tools="")
plot.line(x=[1, 2, 3, 4], y=[1, 3, 2, 4], line_width=3)

structure, properties = generate_structure_plot(plot).children
structure.title.text = "Bokeh models in the example line plot"
structure.width = 590
structure.height = 450
labels = structure.select_one({"type": LabelSet})
labels.text_align = "center"
labels.x_offset = 0
properties.width = 300
properties.height = 240

intro = Div(width=890, text="""
<h2>Explore the structure of a Bokeh plot</h2>
<p>The diagram shows the models that make up the line plot on the left.
Click a model to inspect its properties below the line plot.</p>
""")

show(column(intro, row(column(plot, properties), structure)))
