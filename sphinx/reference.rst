###############
Reference Guide
###############

*NOTE: These are still a work in progress... We need to go through our
docstrings and make them sphinx-compliant, and figure out how to improve
formatting with the sphinx-bootstrap-theme plugin.*


.. contents::
    :local:
    :depth: 3

bokeh.plotting Interface
========================

.. _bokeh_plotting_glyphs:

Glyphs
------
.. autofunction:: bokeh.plotting.annular_wedge
.. autofunction:: bokeh.plotting.annulus
.. autofunction:: bokeh.plotting.arc
.. autofunction:: bokeh.plotting.asterisk
.. autofunction:: bokeh.plotting.bezier
.. autofunction:: bokeh.plotting.circle
.. autofunction:: bokeh.plotting.circle_cross
.. autofunction:: bokeh.plotting.circle_x
.. autofunction:: bokeh.plotting.cross
.. autofunction:: bokeh.plotting.diamond
.. autofunction:: bokeh.plotting.diamond_cross
.. autofunction:: bokeh.plotting.image
.. autofunction:: bokeh.plotting.image_rgba
.. autofunction:: bokeh.plotting.inverted_triangle
.. autofunction:: bokeh.plotting.line
.. autofunction:: bokeh.plotting.multi_line
.. autofunction:: bokeh.plotting.oval
.. autofunction:: bokeh.plotting.patch
.. autofunction:: bokeh.plotting.patches
.. autofunction:: bokeh.plotting.quad
.. autofunction:: bokeh.plotting.quadratic
.. autofunction:: bokeh.plotting.ray
.. autofunction:: bokeh.plotting.rect
.. autofunction:: bokeh.plotting.segment
.. autofunction:: bokeh.plotting.square
.. autofunction:: bokeh.plotting.square_cross
.. autofunction:: bokeh.plotting.square_x
.. autofunction:: bokeh.plotting.text
.. autofunction:: bokeh.plotting.triangle
.. autofunction:: bokeh.plotting.wedge
.. autofunction:: bokeh.plotting.x

.. _bokeh_plotting_sessions:

Sessions
--------
.. autofunction:: bokeh.plotting.output_cloud
.. autofunction:: bokeh.plotting.output_file
.. autofunction:: bokeh.plotting.output_notebook
.. autofunction:: bokeh.plotting.output_server
.. autofunction:: bokeh.plotting.session

.. _bokeh_plotting_plots:

Plots
-----
.. autofunction:: bokeh.plotting.curplot
.. autofunction:: bokeh.plotting.figure
.. autofunction:: bokeh.plotting.hold
.. autofunction:: bokeh.plotting.gridplot
.. autofunction:: bokeh.plotting.save
.. autofunction:: bokeh.plotting.scatter
.. autofunction:: bokeh.plotting.show

.. _bokeh_plotting_styling:

Styling
-------
.. autofunction:: bokeh.plotting.legend
.. autofunction:: bokeh.plotting.axis
.. autofunction:: bokeh.plotting.xaxis
.. autofunction:: bokeh.plotting.yaxis
.. autofunction:: bokeh.plotting.grid
.. autofunction:: bokeh.plotting.xgrid
.. autofunction:: bokeh.plotting.ygrid


Plot Sessions
=============

.. inheritance-diagram:: bokeh.session

.. autoclass:: bokeh.session.Session
.. autoclass:: bokeh.session.BaseHTMLSession
.. autoclass:: bokeh.session.HTMLFileSession
.. autoclass:: bokeh.session.PlotServerSession
.. autoclass:: bokeh.session.NotebookSessionMixin
.. autoclass:: bokeh.session.NotebookSession
.. autoclass:: bokeh.session.NotebookServerSession


Underlying Object System
========================

.. inheritance-diagram:: bokeh.objects

`bokeh.objects`
---------------

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
