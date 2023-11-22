'''An example of linked brushing with two scatter plots showing two views of
the same data.

.. bokeh-example-metadata::
    :sampledata: penguins
    :apis: bokeh.plotting.figure.scatter
    :refs: :ref:`ug_basic_scatters_markers`
    :keywords: scatter, linked brushing

'''
from bokeh.layouts import gridplot
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show
from bokeh.sampledata.penguins import data
from bokeh.transform import factor_cmap

SPECIES = sorted(data.species.unique())

TOOLS = "box_select,lasso_select,help"

source = ColumnDataSource(data)

left = figure(width=300, height=400, title=None, tools=TOOLS,
              background_fill_color="#fafafa")
left.scatter("bill_length_mm", "body_mass_g", source=source,
             color=factor_cmap('species', 'Category10_3', SPECIES))

right = figure(width=300, height=400, title=None, tools=TOOLS,
               background_fill_color="#fafafa", y_axis_location="right")
right.scatter("bill_depth_mm", "body_mass_g", source=source,
              color=factor_cmap('species', 'Category10_3', SPECIES))

show(gridplot([[left, right]]))
