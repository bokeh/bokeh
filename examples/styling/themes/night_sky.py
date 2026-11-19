''' Apply Bokeh's Night Sky theme to a line plot.

.. bokeh-example-metadata::
    :title: Night sky theme
    :keywords: night, sky
    :apis: bokeh.plotting.figure.line
    :gallery: Basic line plot with the night_sky theme.
'''

from bokeh.plotting import curdoc, figure, show

x = [1, 2, 3, 4, 5]
y = [6, 7, 6, 4, 5]

curdoc().theme = 'night_sky'

p = figure(title='night_sky', width=300, height=300)
p.line(x, y)

show(p)
