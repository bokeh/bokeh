.. _gallery:

Gallery
#######

.. toctree::
   :hidden:
   :glob:

   server_gallery/*

.. _gallery_server_examples:

Server Examples
===============

The examples linked below all show off usage of the Bokeh server. The
Bokeh server provides a place where interesting things can happen---data
can be updated to in turn update the plot, and UI and selection events
can be processed to trigger more visual updates. It is also possible to
downsample large data sets or stream continuously updating data from the
Bokeh server.

* :doc:`server_gallery/sliders_server`.
* :doc:`server_gallery/crossfilter_server`.
* :doc:`server_gallery/stocks_server`.

.. _gallery_static_examples:

Standalone Examples
===================

All of the examples below are located in the
`examples <https://github.com/bokeh/bokeh/tree/master/examples>`_
subdirectory of your Bokeh checkout. By "standalone" we mean that 
these examples make no use of the Bokeh server. These plots still
have many interactive tools and features, including linked panning
and brushing, and hover inspectors.

Click on an image below to see its code and interact with the live
plot.

.. cssclass:: gallery clearfix

.. bokeh-gallery:: main_gallery.json



