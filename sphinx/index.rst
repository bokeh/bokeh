.. Bokeh documentation master file, created by
   sphinx-quickstart on Sat Oct 12 23:43:03 2013.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Welcome to Bokeh's documentation!
=================================

Contents:

.. toctree::
   :maxdepth: 2



Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

.. _quickstart:

Quickstart
==========

Have :ref:`quick_data`. Want to make chart.

.. raw:: html

      <script src="https://s3.amazonaws.com/bokeh_docs/0.2/detail/candlestick.embed.js"
      bokeh_plottype="embeddata"
         bokeh_modelid="candlestick" bokeh_modeltype="Plot" async="true"></script>


Barfoo
---

Bar charts::

    import vincent
    bar = vincent.Bar(list_data)

.. image:: /images/quick_bar1.png


Axis Labels
-----------

Labeling the axes is simple::

    bar = vincent.Bar(multi_iter1['y1'])
    bar.axis_titles(x='Index', y='Value')

.. image:: /images/quick_bar2.png

.. _quick_line:
