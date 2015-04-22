.. _tutorial_styling:

Styling Visual Attributes
=========================

.. contents::
    :local:
    :depth: 2

Selecting Plot Objects
----------------------


Setting Plot Ranges
-------------------


Styling Guides and Annotations
------------------------------


Titles
''''''


Axes
''''

**GOAL**: To learn how to change the visual properties of Bokeh plot
axes.

The easiest way to get ahold of Axis objects, so that you can set
style attributes on them, is to use the |xaxis|, |yaxis|, and |axis|
methods on a plot:

.. code-block:: python

    >>> p.xaxis
    [<bokeh.models.axes.LinearAxis at 0x106fa2390>]

This will return a list of Axis objects (since there may be more than
one). But note that, as convenience, you can set attributes directly
on this result, and the attributes will be applied to all the axes:

.. code-block:: python

    p.xaxis.axis_label = "Temperature"

Below is code that will set some of the properties of axes. You can
execute this code, and try setting other properties as well.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("axes.html")

    p = figure(plot_width=400, plot_height=400, title=None)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    # change just some things about the x-axes
    p.xaxis.axis_label = "Temp"
    p.xaxis.axis_line_width = 3
    p.xaxis.axis_line_color = "red"

    # change just some things about the y-axes
    p.yaxis.axis_label = "Pressure"
    p.yaxis.major_label_text_color = "orange"
    p.yaxis.major_label_orientation = "vertical"

    # change things on all axes
    p.axis.minor_tick_in = -3
    p.axis.minor_tick_out = 6

    show(p)

There are many more properties that Bokeh axes support configuring.
For a complete listing of all the various attributes that can be set
on Bokeh axes, consult the :ref:`bokeh.models.axes` section of of the
:ref:`refguide`.

Now we have seen that various line and text properties of plot axes
can be easily set by using the ``xaxis``, ``yaxis`` and ``axis``
properties of plots.

Grids
'''''



Legends
'''''''


.. |legend| replace:: :class:`~bokeh.plotting.Figure.legend`
.. |grid|   replace:: :class:`~bokeh.plotting.Figure.grid`
.. |xgrid|  replace:: :class:`~bokeh.plotting.Figure.xgrid`
.. |ygrid|  replace:: :class:`~bokeh.plotting.Figure.ygrid`
.. |axis|   replace:: :class:`~bokeh.plotting.Figure.axis`
.. |xaxis|  replace:: :class:`~bokeh.plotting.Figure.xaxis`
.. |yaxis|  replace:: :class:`~bokeh.plotting.Figure.yaxis`