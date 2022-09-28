''' A scatter plot using `Fisher's Iris dataset`_. This example demonstrates
manual color mapping with basic plot elements. The chart shows correlation
between petal width and length for three different iris species.

.. note::
    This example is maintained for historical compatibility. Please consider
    `alternatives to Iris`_, such as :ref:`sampledata_penguins`.

.. bokeh-example-metadata::
    :sampledata: iris
    :apis: bokeh.plotting.figure.scatter
    :refs: :ref:`ug_basic_scatters_markers`
    :keywords: alpha, colormap, scatter

.. _Fisher's Iris dataset: https://en.wikipedia.org/wiki/Iris_flower_data_set
.. _alternatives to Iris: https://www.meganstodel.com/posts/no-to-iris/

'''
from bokeh.plotting import figure, show
from bokeh.sampledata.iris import flowers

colormap = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}
colors = [colormap[x] for x in flowers['species']]

p = figure(title="Iris Morphology")
p.xaxis.axis_label = 'Petal Length'
p.yaxis.axis_label = 'Petal Width'

p.scatter(flowers["petal_length"], flowers["petal_width"],
          color=colors, fill_alpha=0.2, size=10)

show(p)
