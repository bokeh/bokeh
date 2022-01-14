''' A categorical heatmap based on simple Python lists of data.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.rect
    :refs: :ref:`userguide_categorical` > :ref:`userguide_categorical_heatmaps`
    :keywords: rect, heatmap

'''
from bokeh.plotting import figure, show

factors = ["foo 123", "bar:0.2", "baz-10"]
x = ["foo 123", "foo 123", "foo 123", "bar:0.2", "bar:0.2", "bar:0.2", "baz-10",  "baz-10",  "baz-10"]
y = ["foo 123", "bar:0.2", "baz-10",  "foo 123", "bar:0.2", "baz-10",  "foo 123", "bar:0.2", "baz-10"]
colors = [
    "#0B486B", "#79BD9A", "#CFF09E",
    "#79BD9A", "#0B486B", "#79BD9A",
    "#CFF09E", "#79BD9A", "#0B486B"
]

p = figure(title="Categorical Heatmap", tools="hover", toolbar_location=None,
           x_range=factors, y_range=factors)

p.rect(x, y, color=colors, width=1, height=1)

show(p)
