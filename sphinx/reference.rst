###############
Reference Guide
###############

*NOTE: These are still a work in progress... We need to go through our
docstrings and make them sphinx-compliant, and figure out how to improve
formatting with the sphinx-bootstrap-theme plugin.*

bokeh.plotting Interface
============================

.. automodule:: bokeh.plotting
    :members:


Sessions
========

.. autoclass:: bokeh.session.Session
.. autoclass:: bokeh.session.BaseHTMLSession
.. autoclass:: bokeh.session.HTMLFileSession
.. autoclass:: bokeh.session.PlotServerSession
.. autoclass:: bokeh.session.NotebookSessionMixin
.. autoclass:: bokeh.session.NotebookSession
.. autoclass:: bokeh.session.NotebookServerSession


Underlying Object System
========================

.. automodule:: bokeh.properties
    :members: BaseProperty, DataSpec, ColorSpec, MetaHasProps, HasProps,
              Int, Float, Complex, File, Bool, String, List, Dict,
              Tuple, Array, Class, Instance, This, Any, Function, Event,
              Either, Enum, Sequence, Mapping, Iterable, Color, Align,
              Pattern, Size, Angle, Percent, FillProps, LineProps, TextProps

Objects
=======

.. autoclass:: bokeh.objects.Viewable
.. autoclass:: bokeh.objects.PlotObject

