.. _ug_topics_categorical:

Categorical plots
=================

Bokeh offers multiple ways to handle and visualize categorical data.
Categorical refers to data that can be divided into distinct groups or
categories, with or without a natural order or numerical value. Examples include
data representing countries, product names, or colors. Unlike continuous data, which
might represent values like temperatures or distances, categorical data is about
labeling and grouping.

Many data sets contain both continuous and categorical data. For example, a
data set of the number of sales of different products in different countries
over a period of time.

It is also possible for categorical data to have multiple values per category.
Previous chapters such as :ref:`ug_basic_bars` and :ref:`ug_basic_scatters` have already
introduced some of the ways to visualize categorical data with single values per
category.

This chapter is focused on more complex categorical data with series of values
for each category and data sets with one or multiple categorical variables.

One categorical variable
------------------------

.. _ug_topics_categorical_scatters_jitter:

Categorical scatter plots with jitter
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The :ref:`chapter on scatter plots <ug_basic_scatters>` contains examples of visualizing
data with single values for each category.

In case your data contains multiple values per category, you can visualize your data
using a categorical scatter plot. This can be useful if you have different series of
measurements for different days of the week, for example.

To avoid overlap between numerous scatter points for a single category, use
the :func:`~bokeh.transform.jitter` function to give each point a random
offset.

The example below shows a scatter plot of every commit time for a GitHub user
between 2012 and 2016. It uses days of the week as categories to groups the commits.
By default, this plot would show thousands of points overlapping in a narrow line for
each day. The ``jitter`` function lets you differentiate the points to produce a useful
plot:

.. bokeh-plot:: __REPO__/examples/topics/categorical/scatter_jitter.py
    :source-position: above

.. _ug_topics_categorical_offsets:

Categorical series with offsets
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A simple example of visualizing categorical data is using
:ref:`bar charts <ug_basic_bars>` to represent a single value per category.

However, if you want to represent ordered series of data per category, you can use
categorical offsets to position the glyphs for the values of each category.
Other than :ref:`visual offsets with dodge <ug_basic_bars_grouped_dodged>`,
categorical offsets afford explicit control over positioning "within" a category.

To supply an offset to a categorical location explicitly, add a numeric value
to the end of a category. For example: ``["Jan", 0.2]`` gives the category
"Jan" an offset of 0.2.

For multi-level categories, add the value at the end of the existing list:
``["West", "Sales", -0,2]``. Bokeh interprets any numeric value at the end
of a list of categories as an offset.

Take the :ref:`fruit example from the "Bar charts" chapter <ug_basic_bars_basic>` and
modify it by adding a list of ``offsets``:

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
category:

.. bokeh-plot:: __REPO__/examples/topics/categorical/ridgeplot.py
    :source-position: below

.. _ug_topics_categorical_slope_graph:

Slopegraphs
~~~~~~~~~~~

Slopegraphs are plots for visualizing the relative change between two or more data
points. This can be useful to visualize the difference between two categories or the
change over time of a variable within a category, for example.

In a slopegraph, you visualize individual measurements as dots arranged into two columns
and indicate pairings by connecting the paired dots with a line.
The slope of each line highlights the magnitude and direction of change.

The following slopegraph visualizes the relative change in CO2
emissions per person in different countries over a period of years or decades.
It uses the :class:`~bokeh.models.glyphs.Segment` glyph to draw the line connecting the
paired dots:

.. bokeh-plot:: __REPO__/examples/topics/categorical/slope_graph.py
    :source-position: above

Two or more categorical variables
---------------------------------

Categorical Heatmaps
~~~~~~~~~~~~~~~~~~~~

It is possible to have values associated with *pairs* of categories. In this
situation, applying different color shades to rectangles that represent a pair
of categories will produce a *categorical heatmap*. This is a plot with two
categorical axes.

The following plot lists years from 1948 to 2016 on its x-axis and months of
the year on the y-axis. Each rectangle of the plot corresponds to a
``(year, month)`` pair. The color of the rectangle indicates the rate of
unemployment in a given month of a given year.

This example uses :func:`~bokeh.transform.linear_cmap` to map the
colors of the plot because the unemployment rate is a continuous variable.
This plot also uses :func:`~bokeh.models.GlyphRenderer.construct_color_bar`
to provide a visual legend on the right:

.. bokeh-plot:: __REPO__/examples/topics/categorical/heatmap_unemployment.py
    :source-position: below

The following periodic table uses several of the techniques in this chapter:

.. bokeh-plot:: __REPO__/examples/topics/categorical/periodic.py
    :source-position: below

.. _ug_topics_categorical_correlograms:

Correlograms
~~~~~~~~~~~~

When you have more than three to four quantitative variables per category, it can be
more useful to quantify the amount of association between pairs of variables and
visualize this quantity rather than the raw data.
One common way to do this is to calculate correlation coefficients.
Visualizations of correlation coefficients are called correlograms.

The following correlogram is another good example of the techniques in this chapter.

This plot displays the correlations as colored circles. The scale of the circles
corresponds to the absolute value of the correlation coefficient.
This way, low correlations are suppressed and high correlations stand out better.

This example uses :func:`~bokeh.transform.linear_cmap` to map the
colors of the plot in order to highlight the correlations between the pair of elements.
This mapper is also uses :func:`~bokeh.models.GlyphRenderer.construct_color_bar`
to provide a visual legend below:

.. bokeh-plot:: __REPO__/examples/topics/categorical/correlogram.py
    :source-position: below
