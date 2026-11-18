''' Apply Bokeh's Carbon theme to a line plot.

.. bokeh-example-metadata::
    :title: Carbon
    :keywords: carbon, appearance, themes
    :apis: bokeh.plotting.figure.line
'''

from bokeh.plotting import curdoc, figure, show

x = [1, 2, 3, 4, 5]
y = [6, 7, 6, 4, 5]

curdoc().theme = 'carbon'

p = figure(title='carbon', width=300, height=300)
p.line(x, y)

show(p)
