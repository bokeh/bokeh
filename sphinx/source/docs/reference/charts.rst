.. _bokeh.charts:

``bokeh.charts``
================

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


.. _bokeh_charts_charts_area:

Area
~~~~

    .. autofunction:: Area

.. _bokeh_charts_charts_bar:

Bar
~~~

    .. autofunction:: Bar

.. _bokeh_charts_charts_boxplot:

BoxPlot
~~~~~~~

    .. autofunction:: BoxPlot

.. _bokeh_charts_charts_chord:

Chord
~~~~~

    .. autofunction:: Chord

.. _bokeh_charts_charts_donut:

Donut
~~~~~

    .. autofunction:: Donut

.. _bokeh_charts_charts_heatmap:

HeatMap
~~~~~~~

    .. autofunction:: HeatMap

.. _bokeh_charts_charts_histogram:

Histogram
~~~~~~~~~

    .. autofunction:: Histogram

.. _bokeh_charts_charts_horizon:

Horizon
~~~~~~~

    .. autofunction:: Horizon

.. _bokeh_charts_charts_line:

Line
~~~~

    .. autofunction:: Line

.. _bokeh_charts_charts_scatter:

Scatter
~~~~~~~

    .. autofunction:: Scatter

.. _bokeh_charts_charts_step:

Step
~~~~

    .. autofunction:: Step

.. _bokeh_charts_charts_TimeSeries:

TimeSeries
~~~~~~~~~~

    .. autofunction:: TimeSeries


.. _bokeh_charts_functions:

Chart Functions
---------------

Data Operations
~~~~~~~~~~~~~~~

.. autofunction:: bokeh.charts.blend
.. autofunction:: bokeh.charts.bins

.. _bokeh_charts_attr_gen:

Attribute Generators
~~~~~~~~~~~~~~~~~~~~

.. autofunction:: bokeh.charts.color
.. autofunction:: bokeh.charts.marker
.. autofunction:: bokeh.charts.cat

.. _bokeh_dot_charts_builders:

Builders
--------

.. autoclass:: bokeh.charts.builders.area_builder.AreaBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.bar_builder.BarBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.boxplot_builder.BoxPlotBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.chord_builder.ChordBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.donut_builder.DonutBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.heatmap_builder.HeatMapBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.histogram_builder.HistogramBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.horizon_builder.HorizonBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.line_builder.LineBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.scatter_builder.ScatterBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.scatter_builder.ScatterBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builders.step_builder.StepBuilder
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
