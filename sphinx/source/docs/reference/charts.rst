
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

Helper Classes
--------------

.. autoclass:: bokeh.charts.Chart
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts._attributes.AttrSpec
    :members:
    :undoc-members:

.. _bokeh_dot_charts_builders:

Builders
--------

.. autoclass:: bokeh.charts.builder.bar_builder.BarBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builder.boxplot_builder.BoxPlotBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builder.histogram_builder.HistogramBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builder.line_builder.LineBuilder
    :members:
    :undoc-members:

.. autoclass:: bokeh.charts.builder.scatter_builder.ScatterBuilder
    :members:
    :undoc-members:
