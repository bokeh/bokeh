
.. _bokeh.charts:

``bokeh.charts`` Interface
==========================

.. contents::
    :local:
    :depth: 2

.. _userguide_charts_generic_arguments:

Chart Options
-------------

See the options available as input to all Charts in
:ref:`userguide_charts_defaults`. Each of these can
be set at a global level with the shared defaults
object, or can be passed as kwargs to each Chart.

Charts
------

.. automodule:: bokeh.charts

    .. autofunction:: Bar
    .. autofunction:: BoxPlot
    .. autofunction:: Histogram
    .. autofunction:: Line
    .. autofunction:: Scatter

Chart Functions
---------------

Data Operations
~~~~~~~~~~~~~~~

.. autofunction:: bokeh.charts.blend

Attribute Generators
~~~~~~~~~~~~~~~~~~~~

.. autofunction:: bokeh.charts.color
.. autofunction:: bokeh.charts.marker
.. autofunction:: bokeh.charts.cat

.. _bokeh_dot_charts_builders:

Builders
--------

.. autoclass:: bokeh.charts.builders.bar_builder.BarBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.boxplot_builder.BoxPlotBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.histogram_builder.HistogramBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.line_builder.LineBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.scatter_builder.ScatterBuilder
    :members:
    :undoc-members:

Helper Classes
--------------

Core Classes
~~~~~~~~~~~~

.. autoclass:: bokeh.charts.Chart
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builder.Builder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.data_source.ChartDataSource
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.data_source.DataGroup
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.models.CompositeGlyph
    :members:
    :undoc-members:
    :exclude-members: build_renderers, build_source

Attribute Specs
~~~~~~~~~~~~~~~

.. autoclass:: bokeh.charts.attributes.AttrSpec
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.attributes.ColorAttr
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.attributes.MarkerAttr
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.attributes.DashAttr
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.attributes.CatAttr
    :members:
    :undoc-members:

