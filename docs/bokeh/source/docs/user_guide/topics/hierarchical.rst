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

.. _Squarify: https://github.com/laserson/squarify
