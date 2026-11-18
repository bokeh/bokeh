''' Use printf formats for scientific notation and labels with units.

.. bokeh-example-metadata::
    :title: Printf tick formatter
    :keywords: printf tick formatter, appearance, plots
    :apis: bokeh.models.PrintfTickFormatter, bokeh.plotting.figure.scatter
'''

from bokeh.models import PrintfTickFormatter
from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.scatter([1,2,3,4,5], [2,5,8,2,7], size=10)

p.xaxis[0].formatter = PrintfTickFormatter(format="%4.1e")
p.yaxis[0].formatter = PrintfTickFormatter(format="%5.3f mu")

show(p)
