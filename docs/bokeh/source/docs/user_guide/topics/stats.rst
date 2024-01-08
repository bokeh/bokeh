.. _ug_topics_stats:

Statistical plots
=================

.. _ug_topics_stats_histogram:

Histogram
---------

Use |quad| glyphs to create a histogram plotted from ``np.histogram`` output

.. bokeh-plot:: __REPO__/examples/topics/stats/histogram.py
    :source-position: above

A population pyramid plot is a divergent horizontal bar plot that can be used to compare distributions between two groups.
In Bokeh they can be created using |hbar| glyphs.

.. bokeh-plot:: __REPO__/examples/topics/stats/pyramid.py
    :source-position: above

.. _ug_topics_stats_boxplot:

Boxplot
-------

Box plots can be assembled using |Whisker| annotations, |vbar| and |scatter|
glyphs:

.. bokeh-plot:: __REPO__/examples/topics/stats/boxplot.py
    :source-position: above

.. _ug_topics_stats_kde:

Kernel density estimation
-------------------------

.. bokeh-plot:: __REPO__/examples/topics/stats/kde2d.py
    :source-position: above

Kernel density estimates can also be plotted using |varea| glyphs:

.. bokeh-plot:: __REPO__/examples/topics/stats/density.py
    :source-position: above

.. _ug_topics_stats_sinaplot:

SinaPlot
--------

SinaPlots can be assembled using the |harea| and |scatter| glyphs:

.. bokeh-plot:: __REPO__/examples/topics/stats/sinaplot.py
    :source-position: above

.. _ug_topics_stats_splom:

SPLOM
-----

A SPLOM is "scatter plot matrix" that arranges multiple scatter plots in a
grid fashion in order to highlight correlations between dimensions. Key
components of a SPLOM are :ref:`ug_interaction_linked_panning` and
:ref:`ug_interaction_linked_brushing` as demonstrated in this example:

.. bokeh-plot:: __REPO__/examples/topics/stats/splom.py
    :source-position: above

.. |harea|   replace:: :func:`~bokeh.plotting.figure.harea`
.. |hbar|    replace:: :func:`~bokeh.plotting.figure.hbar`
.. |quad|    replace:: :func:`~bokeh.plotting.figure.quad`
.. |scatter| replace:: :func:`~bokeh.plotting.figure.scatter`
.. |varea|   replace:: :func:`~bokeh.plotting.figure.varea`
.. |vbar|    replace:: :func:`~bokeh.plotting.figure.vbar`
.. |Whisker| replace:: :class:`~bokeh.models.annotations.Whisker`
