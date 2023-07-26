''' A marker plot that shows the relationship between car type and highway MPG from the autompg
sample data. This example demonstrates the use of whiskers to display quantile ranges in the plot.

.. bokeh-example-metadata::
    :sampledata: autompg2
    :apis: bokeh.models.ColumnDataSource, bokeh.models.Whisker, bokeh.transform.factor_cmap, bokeh.transform.jitter, bokeh.plotting.figure.scatter
    :refs: :ref:`ug_basic_annotations_whiskers`
    :keywords: whisker, jitter, scatter, error

'''

from bokeh.models import ColumnDataSource, Whisker
from bokeh.plotting import figure, show
from bokeh.sampledata.autompg2 import autompg2 as df
from bokeh.transform import factor_cmap, jitter

classes = list(sorted(df["class"].unique()))

p = figure(height=400, x_range=classes, background_fill_color="#efefef",
           title="Car class vs HWY mpg with quantile ranges")
p.xgrid.grid_line_color = None

g = df.groupby("class")
upper = g.hwy.quantile(0.80)
lower = g.hwy.quantile(0.20)
source = ColumnDataSource(data=dict(base=classes, upper=upper, lower=lower))

error = Whisker(base="base", upper="upper", lower="lower", source=source,
                level="annotation", line_width=2)
error.upper_head.size=20
error.lower_head.size=20
p.add_layout(error)

p.scatter(jitter("class", 0.3, range=p.x_range), "hwy", source=df,
          alpha=0.5, size=13, line_color="white",
          color=factor_cmap("class", "Light7", classes))

show(p)
