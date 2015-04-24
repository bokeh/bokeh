.. _tutorial_tools:

Configuring Plot Tools
======================

.. contents::
    :local:
    :depth: 2

Positioning the Toolbar
-----------------------

By default Bokeh plots come with a toolbar above the plot. In this section
you will learn how to specify a different location for the toolbar, or to
remove it entirely.

The toolbar location can be specified by passing the ``toolbar_location``
parameter to the |figure| function or to any |bokeh.charts| Chart function.
Valid values are:

.. hlist::
    :columns: 4

    * ``"above"``
    * ``"below"``
    * ``"left"``
    * ``"right"``

If you would like there to be no toolbar, pass ``None``.

Below is some code that positions the toolbar below the plot. Try
running the code and changing the ``toolbar_position`` value.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("toolbar.html")

    # create a new plot with the toolbar below
    p = figure(plot_width=400, plot_height=400,
               title=None, toolbar_location="below")

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

Specifying Tools
----------------

Tools can be specified by passing the tools parameter to the figure() function or to any bokeh.charts Chart function.
Valid values are either a list of tool types or string listing the tool names. Valid tool names are:

* ``"pan"``
* ``"xpan"``
* ``"ypan"``
* ``"wheel_zoom"``
* ``"xwheel_zoom"``
* ``"ywheel_zoom"``
* ``"save"``
* ``"resize"``
* ``"tap"``
* ``"click"``
* ``"crosshair"``
* ``"box_select"``
* ``"poly_select"``
* ``"lasso_select"``
* ``"box_zoom"``
* ``"hover"``
* ``"previewsave"``
* ``"reset"``
* ``"help"``

that corresponds to the following tool type instances:

* |pantool| (dimensions=["width", "height"])
* |pantool| (dimensions=["width"])
* |pantool| (dimensions=["height"])
* |wheelzoom| (dimensions=["width", "height"])
* |wheelzoom| (dimensions=["width"])
* |wheelzoom| (dimensions=["height"])
* |resizetool| ()
* |taptool| (always_active=True)
* |taptool| (always_active=True)
* |crosshair| ()
* |boxselect| ()
* |polyselect| ()
* |lassoselect| ()
* |boxzoom| ()
* |hovertool| (always_active=True, tooltips=[("index", "$index"),("data (x, y)", "($x, $y)"),("canvas (x, y)", "($sx, $sy)")])
* |previewsave| ()
* |resettool| ()
* |helptool| ()

Below is some code that shows how to specify which tools to add to the toolbar.

Try running the code and changing the name of tools being added to the tools with valid values


.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("toolbar.html")
    TOOLS='box_zoom,box_select,crosshair,resize,reset'
    # create a new plot with the toolbar below
    p = figure(plot_width=400, plot_height=400, title=None, tools=TOOLS)

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

or with a list of the tool instances:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show
    from bokeh.models import HoverTool, BoxSelectTool

    output_file("toolbar.html")
    TOOLS=[BoxSelectTool(), HoverTool()]
    # create a new plot with the toolbar below
    p = figure(plot_width=400, plot_height=400, title=None, tools=TOOLS)

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)


Setting Tool Visuals
--------------------


Hover Tool
''''''''''

The hover tool is a passive inspector tool. It is generally on at all times, but can be configured
in the inspector’s menu associated with the toolbar.

The hover tool displays informational tooltips whenever the cursor is directly over a glyph. The data
to show comes from the glyph’s data source, and what is to be displayed is configurable through a
tooltips attribute that maps display names to columns in the data source, or to special known variables.

Field names starting with “@” are interpreted as columns on the data source.
Field names starting with “$” are special, known fields. For more information about those fields can
be found on the :class:`HoverTool <bokeh.models.tools.HoverTool>`
reference.

Here is an example of how to configure and use the hover tool:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show, ColumnDataSource
    from bokeh.models import HoverTool, BoxSelectTool
    from collections import OrderedDict

    output_file("toolbar.html")

    source = ColumnDataSource(
        data=dict(
            x=[1,2,3,4,5],
            y=[2,5,8,2,7],
            desc=['A', 'b', 'C', 'd', 'E'],
        )
    )

    TOOLS=[
        BoxSelectTool(),
        HoverTool(tooltips = OrderedDict(
            [
            ("index", "$index"),
            ("(x,y)", "($x, $y)"),
            ("desc", "@desc"),
            ]
        ))]
    # create a new plot with the toolbar below
    p = figure(plot_width=400, plot_height=400, title=None, tools=TOOLS)

    p.circle('x', 'y', size=10, source=source)

    show(p)


Overlay Tools
'''''''''''''


.. |pantool| replace:: :class:`~bokeh.models.tools.PanTool`
.. |wheelzoom|   replace:: :class:`~bokeh.models.tools.WheelZoomTool`
.. |previewsave|  replace:: :class:`~bokeh.models.tools.PreviewSaveTool`
.. |resizetool|  replace:: :class:`~bokeh.models.tools.ResizeTool`
.. |taptool|   replace:: :class:`~bokeh.models.tools.TapTool`
.. |crosshair|  replace:: :class:`~bokeh.models.tools.CrosshairTool`
.. |boxselect|  replace:: :class:`~bokeh.models.tools.BoxSelectTool`
.. |polyselect|  replace:: :class:`~bokeh.models.tools.PolySelectTool`
.. |lassoselect|  replace:: :class:`~bokeh.models.tools.LassoSelectTool`
.. |boxzoom|  replace:: :class:`~bokeh.models.tools.BoxZoomTool`
.. |hovertool|  replace:: :class:`~bokeh.models.tools.HoverTool`
.. |resettool|  replace:: :class:`~bokeh.models.tools.ResetTool`
.. |helptool|  replace:: :class:`~bokeh.models.tools.HelpTool`