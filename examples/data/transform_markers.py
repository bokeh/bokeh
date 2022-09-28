''' A scatter plot using the `Palmer penguin dataset`_. This example
demonstrates color and marker mapping with basic plot elements. The chart
shows correlation between body mass and flipper length for three different
penguin species.

.. bokeh-example-metadata::
    :sampledata: penguins
    :apis: bokeh.plotting.figure.scatter, bokeh.transform.linear_cmap, bokeh.transform.factor_mark
    :refs: :ref:`ug_basic_scatters_markers`, :ref:`ug_basic_data_transforming`
    :keywords: alpha, colormap, markermap, scatter

.. _Palmer penguin dataset: https://github.com/allisonhorst/palmerpenguins

'''
from bokeh.plotting import figure, show
from bokeh.sampledata.penguins import data
from bokeh.transform import factor_cmap, factor_mark

SPECIES = sorted(data.species.unique())
MARKERS = ['hex', 'circle_x', 'triangle']

p = figure(title = "Penguin size", background_fill_color="#fafafa")
p.xaxis.axis_label = 'Flipper Length (mm)'
p.yaxis.axis_label = 'Body Mass (g)'

p.scatter("flipper_length_mm", "body_mass_g", source=data,
          legend_group="species", fill_alpha=0.4, size=12,
          marker=factor_mark('species', MARKERS, SPECIES),
          color=factor_cmap('species', 'Category10_3', SPECIES))

p.legend.location = "top_left"
p.legend.title = "Species"

show(p)
