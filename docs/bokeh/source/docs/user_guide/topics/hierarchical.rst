.. _ug_topics_hierarchical:

Hierarchical data
=================

Bokeh does not have any built-in APIs specifically for handling hierarchical
data, but it is possible to use Bokeh's basic components together with other
libraries to handle many cases. Some examples are described below.

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

Hierarchical tables
-------------------

For hierarchical tables, use the `Panel Tabulator`_ widget. Bokeh-only
applications can pre-aggregate their data and display the result in a
:class:`~bokeh.models.widgets.tables.DataTable`; applications that require
expand and collapse behavior need to rebuild the visible rows in Python or
``CustomJS`` callbacks.

For example, a pandas ``DataFrame`` with a hierarchical index can be migrated
to Panel as follows:

.. code-block:: python

    import panel as pn

    table = pn.widgets.Tabulator(
        df.set_index(["d0", "d1", "d2"]),
        hierarchical=True,
        aggregators={"d0": {"px": "sum"}, "d1": {"px": "sum"}},
    )

.. _Panel Tabulator: https://panel.holoviz.org/reference/widgets/Tabulator.html#hierarchical-multi-index
