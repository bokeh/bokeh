
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
* :doc:`solutions/gallery/stocks`

.. literalinclude:: exercises/stocks.py
   :language: python
   :linenos:
   :emphasize-lines: 32,33,41,43,53,54,56,58

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
* :doc:`solutions/gallery/histogram`

.. literalinclude:: exercises/histogram.py
   :language: python
   :linenos:
   :emphasize-lines: 19,52,54,55,56,57,58

.. _boxplot:

Boxplots
--------

* exercise location: **exercises/boxplot.py**
* :doc:`solutions/gallery/boxplot`

.. literalinclude:: exercises/boxplot.py
   :language: python
   :linenos:
   :emphasize-lines: 38,53,59,67,69,70,71

.. _cat_heatmap:

Heatmaps
--------

The Wall-Street Journal published an excellent heatmap chart `U.S. Unemployment: A Historical View <http://online.wsj.com/news/articles/SB10001424052748703338004575230041742556522>`_. We will create a similar chart
using Bokeh. This data may be obtained from `The Bureau of Labor Statistics <http://data.bls.gov/timeseries/LNU04000000>`_.

* exercise location: **exercises/unemployment.py**
* :doc:`solutions/gallery/unemployment`

.. literalinclude:: exercises/unemployment.py
   :language: python
   :linenos:
   :emphasize-lines: 33,43,50,51,52,53,54,55,57,58,59,60,61,63

.. _bar_chart:

Bar Charts
----------

Let's plot some bar charts using 2014 Olympics data. We will make both stacked and grouped
bar charts of medals won by country. The data for this exercise was obtained using the
`Sochi API Explorer from Kimono Labs <http://www.kimonolabs.com/sochi/explorer>`_.

* exercise location: **exercises/olympics.py**
* :doc:`solutions/gallery/olympics`

.. literalinclude:: exercises/olympics.py
   :language: python
   :linenos:
   :emphasize-lines: 17,30,32,33,34,35,36,48,49,50,52,53,54,55,56



