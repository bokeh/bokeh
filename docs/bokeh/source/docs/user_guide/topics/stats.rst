.. _ug_topics_stats:

Statistical plots
=================

.. _ug_topics_stats_histogram:

Histogram
---------

Use |quad| glyphs to create a histogram plotted from ``np.histogram`` output

.. bokeh-plot:: __REPO__/examples/topics/stats/histogram.py
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

.. _ug_topics_stats_splom:

SPLOM
-------

A SPLOM is "scatter plot matrix" that arranges multiple scatter plots in a
grid fashion in order to highlight correlations between dimensions. Key
components of a SPLOM are :ref:`ug_interaction_linked_panning` and
:ref:`ug_interaction_linked_brushing` as demonstrated in this example:

.. bokeh-plot:: __REPO__/examples/topics/stats/splom.py
    :source-position: above

.. |quad|    replace:: :func:`~bokeh.plotting.figure.quad`
.. |scatter| replace:: :func:`~bokeh.plotting.figure.scatter`
.. |vbar|    replace:: :func:`~bokeh.plotting.figure.vbar`
.. |Whisker| replace:: :class:`~bokeh.models.annotations.Whisker`
