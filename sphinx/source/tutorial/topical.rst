
Topical Exercises
=================

.. contents::
    :local:

.. _timeseries:

Timeseries
----------

Bokeh includes support for formatting datetime information as well as picking nice
ticks on datetime axes. Here we will plot some stock data taken from the `Yahoo Finance API <https://code.google.com/p/yahoo-finance-managed/wiki/csvHistQuotesDownload>`_.

* exercise location: **exercises/stocks.py**

.. literalinclude:: exercises/stocks.py
   :language: python
   :linenos:
   :emphasize-lines: 22,24,25,35,37,47,48,50,52

See the :doc:`solutions/gallery/stocks`.


.. _histogram:

Histograms
----------

Histograms are a staple analytical tool in many analytical domains. Let's create some
histograms of samples taken from various statistical distributions, together with the
ideal probability density and cumulative distribution functions overlaid.

Instead of the ``rect`` renderer, which takes a center point, width and height, we will
use the ``quad`` renderer. It is intended for axis-aligned rectangles, and accepts
coordinates for left, right, top, and bottom.

* exercise location: **exercises/histogram.py**

.. literalinclude:: exercises/histogram.py
   :language: python
   :linenos:
   :emphasize-lines: 20,22,34,50,65-67

See the :doc:`solutions/gallery/histogram`.

.. _boxplot:

Boxplots
--------

* exercise location: **exercises/boxplot.py**

.. literalinclude:: exercises/boxplot.py
   :language: python
   :linenos:
   :emphasize-lines: 35,37,44,50,58,60-62

See the :doc:`solutions/gallery/boxplot`.

.. _cat_heatmap:

Heatmaps
--------

The Wall-Street Journal published an excellent heatmap chart `U.S. Unemployment: A Historical View <http://online.wsj.com/news/articles/SB10001424052748703338004575230041742556522>`_. We will create a similar chart
using Bokeh. This data may be obtained from `The Bureau of Labor Statistics <http://data.bls.gov/timeseries/LNU04000000>`_.

* exercise location: **exercises/unemployment.py**

.. literalinclude:: exercises/unemployment.py
   :language: python
   :linenos:
   :emphasize-lines: 34,36,38,40-45,56-60,62

See the :doc:`solutions/gallery/unemployment`.

.. _bar_chart:

Bar Charts
----------

Let's plot some bar charts using 2014 Olympics data. We will make both stacked and grouped
bar charts of medals won by country. The data for this exercise was obtained using the
`Sochi API Explorer from Kimono Labs <http://www.kimonolabs.com/sochi/explorer>`_.

* exercise location: **exercises/olympics.py**

.. literalinclude:: exercises/olympics.py
   :language: python
   :linenos:
   :emphasize-lines: 18,20,29,31-35,37,44-46,48-52

See the :doc:`solutions/gallery/olympics`.


