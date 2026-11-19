''' Apply Bokeh's Contrast theme to a line plot.

.. bokeh-example-metadata::
    :title: Contrast theme
    :keywords: contrast
    :apis: bokeh.plotting.figure.line
    :gallery: Basic line plot with the contrast theme.
'''

from bokeh.plotting import curdoc, figure, show

x = [1, 2, 3, 4, 5]
y = [6, 7, 6, 4, 5]

curdoc().theme = 'contrast'

p = figure(title='contrast', width=300, height=300)
p.line(x, y)

show(p)
