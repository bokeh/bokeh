.. _ug_specialized_stats:

Statistical plots
=================

.. _ug_specialized_stats_histogram:

Histogram
---------

A histogram may be plotted from ``np.histogram`` output using |quad| glyphs:

.. bokeh-plot:: __REPO__/examples/specialized/stats/histogram.py
    :source-position: above

.. _ug_specialized_stats_boxplot:

Boxplot
-------

Box plots require more work. Here is an example that utilizes |segment| and
|vbar| glyphs to accomplish the task:

.. bokeh-plot:: __REPO__/examples/specialized/stats/boxplot.py
    :source-position: above

.. _ug_specialized_stats_splom:

SPLOM
-------

A SPLOM is "scatter plot matrix" that arranges multiple scatter plots in a
grid fashion in order to highlight correlations between dimenstions. A key
component of a SPLOM is linked behaviors, demonstrated in the example below.

.. bokeh-plot:: __REPO__/examples/specialized/stats/splom.py
    :source-position: above

.. |quad|    replace:: :func:`~bokeh.plotting.figure.quad`
.. |segment| replace:: :func:`~bokeh.plotting.figure.segment`
.. |vbar|    replace:: :func:`~bokeh.plotting.figure.vbar`
