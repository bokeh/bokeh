
.. _bokeh.charts:

``bokeh.charts`` Interface
==========================

.. contents::
    :local:
    :depth: 2

Chart Options
-------------

See the options available as input to all Charts in
:ref:`userguide_charts_defaults`. Each of these can
be set at a global level with the shared defaults
object, or can be passed as kwargs to each Chart.

.. _bokeh_charts_charts:

Charts
------

.. automodule:: bokeh.charts

    .. autofunction:: Bar
    .. autofunction:: BoxPlot
    .. autofunction:: Histogram
    .. autofunction:: Line
    .. autofunction:: Scatter

.. _bokeh_charts_functions:

Chart Functions
---------------

Data Operations
~~~~~~~~~~~~~~~

.. autofunction:: bokeh.charts.blend

.. _bokeh_charts_attr_gen:

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

.. _bokeh_charts_helper_classes:

Helper Classes
--------------

.. _bokeh_charts_core:

Core Classes
~~~~~~~~~~~~

.. autoclass:: bokeh.charts.Chart
    :members:
    :undoc-members:

    .. automethod:: bokeh.charts.Chart.__init__

.. autoclass:: bokeh.charts.builder.Builder
    :members:
    :undoc-members:

    .. automethod:: bokeh.charts.builder.Builder.__init__

.. autoclass:: bokeh.charts.data_source.ChartDataSource
    :members:
    :undoc-members:

    .. automethod:: bokeh.charts.data_source.ChartDataSource.__init__

.. autoclass:: bokeh.charts.data_source.DataGroup
    :members:
    :undoc-members:

    .. automethod:: bokeh.charts.data_source.DataGroup.__init__

.. autoclass:: bokeh.charts.models.CompositeGlyph
    :members:
    :undoc-members:

    .. automethod:: bokeh.charts.models.CompositeGlyph.__init__

.. _bokeh_charts_attr_specs:

Attribute Specs
~~~~~~~~~~~~~~~

.. autoclass:: bokeh.charts.attributes.AttrSpec
    :members:
    :undoc-members:

    .. automethod:: bokeh.charts.attributes.AttrSpec.__init__

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

Utilities
---------

.. autofunction:: bokeh.charts.utils.df_from_json


