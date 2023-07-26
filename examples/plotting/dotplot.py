''' A categorical dot plot based on simple Python lists of data.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.scatter, bokeh.plotting.figure.segment
    :keywords: scatter, dotplot, segments

'''
from bokeh.plotting import figure, show

factors = ["a", "b", "c", "d", "e", "f", "g", "h"]
x =  [50, 40, 65, 10, 25, 37, 80, 60]

p = figure(title="Categorical Dot Plot", tools="", toolbar_location=None,
           y_range=factors, x_range=[0,100])

p.segment(0, factors, x, factors, line_width=2, line_color="green" )
p.scatter(x, factors, size=15, fill_color="orange", line_color="green", line_width=3 )

show(p)
