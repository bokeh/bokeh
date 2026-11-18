''' Format y-axis labels with a JavaScript callback.

.. bokeh-example-metadata::
    :title: Custom js tick formatter
    :keywords: custom, js, tick, formatter
    :apis: bokeh.models.CustomJSTickFormatter, bokeh.plotting.figure.scatter
'''

from bokeh.models import CustomJSTickFormatter
from bokeh.plotting import figure, show

p = figure(width=500, height=500)
p.scatter([0, 2, 4, 6, 8, 10], [6, 2, 4, 10, 8, 0], size=30)

p.yaxis.formatter = CustomJSTickFormatter(code="""
    return Math.floor(tick) + " + " + (tick % 1).toFixed(2)
""")

show(p)
