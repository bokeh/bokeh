.. _ug_topics_hierarchical:

Hierarchical data
=================

.. _ug_topics_hierarchical_treemap:

Treemaps
--------

A treemap plot provides view a hierarchical data that help highlight patterns,
e.g. largest or smallest sellers in sales data. Tree branches are represented
by rectangles and sub-branches by smaller, nested rectangles.

Tee example below shows how a treemap plot can be created using the Bokeh
:func:`~bokeh.plotting.figure.block` function together with the third-party
`Squarify`_ library.

.. bokeh-plot:: __REPO__/examples/topics/hierarchical/treemap.py
    :source-position: above

.. _ug_topics_hierarchical_crosstab:

Cross tabulations
-----------------

Cross tabulations (i.e. "crosstabs") also show relationships between parts
of a whole and each other. The example below shows an adjacent bar chart
applied to a crosstab of sample superstore data. This example is more
involved due to more extensive styling and inline labeling.

.. bokeh-plot:: __REPO__/examples/topics/hierarchical/crosstab.py
    :source-position: above

.. _Squarify: https://github.com/laserson/squarify
