.. _bokeh.plotting.helpers:

helpers
=======

Besides |figure| and |gmap| the ``bokeh.plotting`` module also contains
additional functions and attributes liste in this section.

The following functions and classes are imported transitively and made
available from ``bokeh.plotting`` as a convenience:

* :class:`bokeh.document.Document`
* :class:`bokeh.io.curdoc`
* :class:`bokeh.io.output_file`
* :class:`bokeh.io.output_notebook`
* :class:`bokeh.io.reset_output`
* :class:`bokeh.io.save`
* :class:`bokeh.io.show`
* :class:`bokeh.layouts.column`
* :class:`bokeh.layouts.gridplot`
* :class:`bokeh.layouts.row`
* :class:`bokeh.models.ColumnDataSource`

from_networkx
-------------

.. autofunction:: bokeh.plotting.from_networkx

markers
-------

.. autofunction:: bokeh.plotting.markers

DEFAULT_TOOLS
-------------

.. autodata:: bokeh.plotting.DEFAULT_TOOLS

    A default set of tools configured if no configuration is provided.

.. |gmap|               replace:: :py:func:`~bokeh.plotting.gmap`
