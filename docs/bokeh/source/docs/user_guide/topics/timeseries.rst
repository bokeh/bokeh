.. _ug_topics_timeseries:

Timeseries plots
================

.. _ug_topics_timeseries_units:

Units
-----

Bokeh can automatically handle many kinds of datetime types, for instance
Numpy datetime arrays and Pandas datetime series, as well as Python built-in
datetime types. It can sometimes be helpful to understand how Bokeh represents
these values.

Internally, all datetime values are floating point values that represent
*milliseconds-since-epoch* (specifically, "epoch" here refers to `unix time`_,
i.e. *1 January 1970 00:00:00 UTC*). Bokeh will convert datetime values to this
floating point format before passing on to BokehJS. On occasion (e.g. in
``CustomJS`` callbacks) it may be necessary to use these values directly.

.. _unix time: https://en.wikipedia.org/wiki/Unix_time

.. _ug_topics_timeseries_range_tool:

Range tool
----------

It is often desirable to be able to zoom in on one region of a timeseries
while still seeing a view of the full series for context. The ``RangeTool``
can be used to interactively define a region in one plot that results in a
zoomed view on another plot. This is demonstrated below:

.. bokeh-plot:: __REPO__/examples/interaction/tools/range_tool.py

.. _ug_topics_timeseries_candlestick:

Candlestick chart
-----------------

.. bokeh-plot:: __REPO__/examples/topics/timeseries/candlestick.py

.. _ug_topics_timeseries_missing_dates:

Missing dates
-------------

.. bokeh-plot:: __REPO__/examples/topics/timeseries/missing_dates.py
