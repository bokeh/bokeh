.. _ug_specialized_stats:

Statistical plots
=================

.. _ug_specialized_stats_histogram:

Histogram
---------

Use |quad| glyphs to create a histogram plotted from ``np.histogram`` output

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
grid fashion in order to highlight correlations between dimensions. Key
components of a SPLOM are :ref:`ug_interaction_linked_panning` and
:ref:`ug_interaction_linked_brushing` as demonstrated in this example:

.. bokeh-plot:: __REPO__/examples/specialized/stats/splom.py
    :source-position: above

.. |quad|    replace:: :func:`~bokeh.plotting.figure.quad`
.. |segment| replace:: :func:`~bokeh.plotting.figure.segment`
.. |vbar|    replace:: :func:`~bokeh.plotting.figure.vbar`
