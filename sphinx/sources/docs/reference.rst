###############
Reference Guide
###############

.. contents::
    :local:
    :depth: 3

High Level Plotting Interface
=============================

.. _bokeh_plotting_glyphs:

Glyphs Functions
----------------
.. autofunction:: bokeh.plotting.annular_wedge(x,y,inner_radius,outer_radius,start_angle,end_angle, **kwargs)
.. autofunction:: bokeh.plotting.annulus(x, y, inner_radius, outer_radius, **kwargs)
.. autofunction:: bokeh.plotting.arc(x, y, radius, start_angle, end_angle, **kwargs)
.. autofunction:: bokeh.plotting.asterisk(x, y, size=5, **kwargs)
.. autofunction:: bokeh.plotting.bezier(x0, y0, x1, y1, cx0, cy0, cx1, cy1, **kwargs)
.. autofunction:: bokeh.plotting.circle(x, y, **kwargs)
.. autofunction:: bokeh.plotting.circle_cross(x, y, size=5, **kwargs)
.. autofunction:: bokeh.plotting.circle_x(x, y, size=5, **kwargs)
.. autofunction:: bokeh.plotting.cross(x, y, size=5, **kwargs)
.. autofunction:: bokeh.plotting.diamond(x, y, size=5, **kwargs)
.. autofunction:: bokeh.plotting.diamond_cross(x, y, size=5, **kwargs)
.. autofunction:: bokeh.plotting.image(image, x, y, dw, dh, palette)
.. autofunction:: bokeh.plotting.image_rgba(image, x, y, dw, dh)
.. autofunction:: bokeh.plotting.inverted_triangle(x, y, size=5, **kwargs)
.. autofunction:: bokeh.plotting.line(x, y, *kwargs)
.. autofunction:: bokeh.plotting.multi_line(xs, ys, **kwargs)
.. autofunction:: bokeh.plotting.oval(x, y, width, height, angle=0, **kwargs)
.. autofunction:: bokeh.plotting.patch(x, y, **kwargs)
.. autofunction:: bokeh.plotting.patches(xs, ys, **kwargs)
.. autofunction:: bokeh.plotting.quad(left, right, top, bottom, **kwargs)
.. autofunction:: bokeh.plotting.quadratic(x0, y0, x1, y1, cx, cy, **kwargs)
.. autofunction:: bokeh.plotting.ray(x, y, length, angle, **kwargs)
.. autofunction:: bokeh.plotting.rect(x, y, width, height, angle=0, **kwargs)
.. autofunction:: bokeh.plotting.segment(x0, y0, x1, y1, *kwargs)
.. autofunction:: bokeh.plotting.square(x, y, size=5, **kwargs)
.. autofunction:: bokeh.plotting.square_cross(x, y, size=5, **kwargs)
.. autofunction:: bokeh.plotting.square_x(x, y, size=5, **kwargs)
.. autofunction:: bokeh.plotting.text(x, y, text, angle=0, *kwargs)
.. autofunction:: bokeh.plotting.triangle(x, y, size=5, **kwargs)
.. autofunction:: bokeh.plotting.wedge(x, y, radius, start_angle, end_angle, **kwargs)
.. autofunction:: bokeh.plotting.x(x, y, size=5, **kwargs)

.. _bokeh_plotting_sessions:

Session Management
------------------
.. autofunction:: bokeh.plotting.output_cloud
.. autofunction:: bokeh.plotting.output_file
.. autofunction:: bokeh.plotting.output_notebook
.. autofunction:: bokeh.plotting.output_server
.. autofunction:: bokeh.plotting.session

.. _bokeh_plotting_plots:

Plot Manipulation
-----------------
.. autofunction:: bokeh.plotting.curplot
.. autofunction:: bokeh.plotting.figure
.. autofunction:: bokeh.plotting.hold
.. autofunction:: bokeh.plotting.gridplot
.. autofunction:: bokeh.plotting.save
.. autofunction:: bokeh.plotting.scatter
.. autofunction:: bokeh.plotting.show

.. _bokeh_plotting_styling:

Styling Accessors
-----------------
.. autofunction:: bokeh.plotting.legend
.. autofunction:: bokeh.plotting.axis
.. autofunction:: bokeh.plotting.xaxis
.. autofunction:: bokeh.plotting.yaxis
.. autofunction:: bokeh.plotting.grid
.. autofunction:: bokeh.plotting.xgrid
.. autofunction:: bokeh.plotting.ygrid

Advanced Functions
------------------

.. autofunction:: bokeh.plotting.visual

Compatiblity Layers
===================

Coming Soon.

Underlying Object System
========================

`bokeh.session`
---------------

.. inheritance-diagram:: bokeh.session

.. autoclass:: bokeh.session.Session
.. autoclass:: bokeh.session.BaseHTMLSession
.. autoclass:: bokeh.session.HTMLFileSession
.. autoclass:: bokeh.session.PlotServerSession
.. autoclass:: bokeh.session.NotebookSessionMixin
.. autoclass:: bokeh.session.NotebookSession
.. autoclass:: bokeh.session.NotebookServerSession

`bokeh.objects`
---------------

.. inheritance-diagram:: bokeh.objects

.. automodule:: bokeh.objects
    :members:

`bokeh.properties`
------------------

.. inheritance-diagram:: bokeh.properties

.. automodule:: bokeh.properties
    :members: BaseProperty, DataSpec, ColorSpec, MetaHasProps, HasProps,
              Int, Float, Complex, File, Bool, String, List, Dict,
              Tuple, Array, Class, Instance, This, Any, Function, Event,
              Either, Enum, Sequence, Mapping, Iterable, Color, Align,
              Pattern, Size, Angle, Percent, FillProps, LineProps, TextProps
