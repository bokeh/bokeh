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
* :doc:`server_gallery/line_animate`.
* :doc:`server_gallery/aw_animate`.

.. _gallery_static_examples:

Static Examples
===============

All of the static examples below are located in the
`examples <https://github.com/bokeh/bokeh/tree/master/examples>`_
subdirectory of your Bokeh checkout. By "static", we simply mean
that no use is made of the Bokeh server. Static plots can still
have many interactive tools and features, including linked panning
and brushing, and hover inspectors.

Click on an image below to see its code and interact with the live
plot.

.. cssclass:: gallery clearfix

.. bokeh-gallery:: main_gallery.json



