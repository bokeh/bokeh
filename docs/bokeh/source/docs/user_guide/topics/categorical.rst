.. _ug_topics_categorical:

Categorical plots
=================

Scatters
--------

Sometimes there are many values associated with each category. For example, a
series of measurements on different days of the week. In this case, you can
visualize your data using a categorical scatter plot.

.. _ug_topics_categorical_scatters_jitter:

Adding jitter
~~~~~~~~~~~~~

To avoid overlap between numerous scatter points for a single category, use
the :func:`~bokeh.transform.jitter` function to give each point a random
offset.

The example below shows a scatter plot of every commit time for a GitHub user
between 2012 and 2016. It groups commits by day of the week. By default, this
plot would show thousands of points overlapping in a narrow line for each day.
The ``jitter`` function lets you differentiate the points to produce a useful
plot:

.. bokeh-plot:: __REPO__/examples/topics/categorical/scatter_jitter.py
    :source-position: above

Series
------

There may also be ordered series of data associated with each category. In such
cases, the series can be represented as a line or area plotted for each
category.
To accomplish this, Bokeh has a concept of categorical offsets that can afford
explicit control over positioning "within" a category.

.. _ug_topics_categorical_offsets:

Categorical offsets
~~~~~~~~~~~~~~~~~~~

Outside of the ``dodge`` and ``jitter`` functions, you can also supply an
offset to a categorical location explicitly. To do so, add a numeric value
to the end of a category. For example, ``["Jan", 0.2]`` gives the category
"Jan" an offset of 0.2.

For multi-level categories, add the value at the end of the existing list:
``["West", "Sales", -0,2]``. Bokeh interprets any numeric value at the end
of a list of categories as an offset.

Take the fruit example above and modify it as follows:

.. code-block:: python

    fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']

    offsets = [-0.5, -0.2, 0.0, 0.3, 0.1, 0.3]

    # This results in [ ['Apples', -0.5], ['Pears', -0.2], ... ]
    x = list(zip(fruits, offsets))

    p.vbar(x=x, top=[5, 3, 4, 2, 4, 6], width=0.8)

This will shift each bar horizontally by the corresponding offset.

.. bokeh-plot:: __REPO__/examples/topics/categorical/categorical_offset.py
    :source-position: none

Below is a more sophisticated example of a ridge plot. It uses
categorical offsets to specify patch coordinates for each
category.

.. bokeh-plot:: __REPO__/examples/topics/categorical/ridgeplot.py
    :source-position: below

Heatmaps
--------

It is possible to have values associated with *pairs* of categories. In this
situation, applying different color shades to rectangles that represent a pair
of categories will produce a *categorical heatmap*. Such a plot has two
categorical axes.

The following plot lists years from 1948 to 2016 on its x-axis and months of
the year on the y-axis. Each rectangle of the plot corresponds to a
``(year, month)`` pair. The color of the rectangle indicates the rate of
unemployment in a given month of a given year.

This example uses the ``LinearColorMapper`` to map the colors of the plot
because the unemployment rate is a continuous variable. This mapper is also
passed to the color bar to provide a visual legend on the right:

.. bokeh-plot:: __REPO__/examples/topics/categorical/heatmap_unemployment.py
    :source-position: below

The following periodic table is a good example of the techniques
in this chapter:

* Color mappers
* Visual offsets
* pandas DataFrames
* Tooltips

.. bokeh-plot:: __REPO__/examples/topics/categorical/periodic.py
    :source-position: below
