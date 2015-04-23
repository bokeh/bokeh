.. _tutorial_styling:

Styling Visual Attributes
=========================

.. contents::
    :local:
    :depth: 3

Selecting Plot Objects
----------------------


Setting Plot Ranges
-------------------


Styling Guides and Annotations
------------------------------


Titles
~~~~~~


Axes
~~~~
In this section you will learn how to change various visual properties
of Bokeh plot axes.

The easiest way to get ahold of Axis objects, so that you can set
style attributes on them, is to use the |xaxis|, |yaxis|, and |axis|
methods on a plot:

.. code-block:: python

    >>> p.xaxis
    [<bokeh.models.axes.LinearAxis at 0x106fa2390>]

This returns a list of Axis objects (since there may be more than
one). But note that, as convenience, these lists are *splattable*,
meaning that you can set attributes directly on this result, and
the attributes will be applied to all the axes in the list:

.. code-block:: python

    p.xaxis.axis_label = "Temperature"

will change the value of ``axis_label`` for every x-axis (however
many there may be).

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

----

Now we have seen that various line and text properties of plot axes
can be easily set by using the |xaxis|, |yaxis| and |axis| properties
of plots.

There are many more properties that Bokeh axes support configuring.
For a complete listing of all the various attributes that can be set
on different types of Bokeh axes, consult the :ref:`bokeh.models.axes`
section of of the :ref:`refguide`.

Grids
~~~~~

In this section you will learn how to set the visual properties of grid
lines and grid bands on Bokeh plots.

Similar to the convenience methods for axes, there are |xgrid|, |ygrid|,
and |grid| methods on plots that can be used to get ahold of the grid
objects:

.. code-block:: python

    >>> p.grid
    [<bokeh.models.grids.Grid at 0x106fa2278>,
     <bokeh.models.grids.Grid at 0x106fa22e8>]

These methods also return splattable lists, so that you can set attributes
on the list, as if it was a single object, and the attribute is changed
for every element of the list:

.. code-block:: python

    p.grid.line_dash = [4 2]

.. note::
    The ``xgrid`` property provides the grid objects that *intersect* the
    x-axis (i.e., are vertical). Correspondingly, ``ygrid`` provides
    the grid objects that intersect the y-axis (i.e., are horizontal).

Lines
'''''

Below is code that will set some of the properties of grid lines. You can
execute this code, and try setting other properties as well.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("gridlines.html")

    p = figure(plot_width=400, plot_height=400, title=None)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    # change just some things about the x-grid
    p.xgrid.grid_line_color = None

    # change just some things about the y-grid
    p.ygrid.grid_line_alpha = 0.5
    p.ygrid.grid_line_dash = [6, 4]

    show(p)

Bands
'''''

It is also possible to display filled, shaded bands between adjacent
grid lines. Below is code that will set some of the fill properties of
grids bands. You can execute this code, and try setting different values.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("gridbands.html")

    p = figure(plot_width=400, plot_height=400, title=None)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    # change just some things about the x-grid
    p.xgrid.grid_line_color = None

    # change just some things about the y-grid
    p.ygrid.band_fill_alpha = 0.1
    p.ygrid.band_fill_color = "navy"

    show(p)

----

Now we have seen that various line properties of plot grids can be easily
set by using the |xgrid|, |ygrid| and |grid| properties of plots.

There are other properties that Bokeh grids support configuring.
For a complete listing of all the various attributes that can be set
on Bokeh plot grids, consult the :ref:`bokeh.models.grids` section of the
:ref:`refguide`.

Legends
~~~~~~~

.. |legend| replace:: :class:`~bokeh.plotting.Figure.legend`
.. |grid|   replace:: :class:`~bokeh.plotting.Figure.grid`
.. |xgrid|  replace:: :class:`~bokeh.plotting.Figure.xgrid`
.. |ygrid|  replace:: :class:`~bokeh.plotting.Figure.ygrid`
.. |axis|   replace:: :class:`~bokeh.plotting.Figure.axis`
.. |xaxis|  replace:: :class:`~bokeh.plotting.Figure.xaxis`
.. |yaxis|  replace:: :class:`~bokeh.plotting.Figure.yaxis`