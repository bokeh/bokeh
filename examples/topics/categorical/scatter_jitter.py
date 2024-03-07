''' A categorical scatter plot based on GitHub commit history. This example
demonstrates using a ``jitter`` transform.

.. bokeh-example-metadata::
    :sampledata: commits
    :apis: bokeh.plotting.figure.scatter
    :refs: :ref:`ug_topics_categorical_scatters_jitter`
    :keywords: jitter, scatter

'''
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show
from bokeh.sampledata.commits import data
from bokeh.transform import jitter

DAYS = ['Sun', 'Sat', 'Fri', 'Thu', 'Wed', 'Tue', 'Mon']

source = ColumnDataSource(data)

p = figure(width=800, height=300, y_range=DAYS, x_axis_type='datetime',
           title="Commits by Time of Day (US/Central) 2012-2016")

p.scatter(x='time', y=jitter('day', width=0.6, range=p.y_range), source=source, alpha=0.3)

p.xaxis.formatter.days = '%Hh'
p.x_range.range_padding = 0
p.ygrid.grid_line_color = None

show(p)
