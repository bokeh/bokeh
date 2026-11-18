''' Place x-axis ticks at a fixed list of positions.

.. bokeh-example-metadata::
    :title: Fixed ticker
    :keywords: fixed ticker, appearance, plots
    :apis: bokeh.plotting.figure.scatter
'''

from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.scatter([1,2,3,4,5], [2,5,8,2,7], size=10)

p.xaxis.ticker = [2, 3.5, 4]

show(p)
