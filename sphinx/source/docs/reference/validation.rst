
.. _bokeh.validation:

``bokeh.validation`` Package
============================

To create a Bokeh visualization, the central task is to assemble a collection
model objects from |bokeh.models| into a graph that represents the scene that
should be created in the client. It is possible to to this "by hand", using the
model objects directly. However, to make this process easier, Bokeh provides
higher level interfaces such as |bokeh.plotting| and |bokeh.charts| for users.
These interfaces automate common "assembly" steps, to ensure a Bokeh object
graph is created in a consistent, predictable way. However, regardless of what
interface is used, it is possible to put Bokeh models together in ways that are
incomplete, or that do not make sense in some way.

To assist with diagnosing potential problems, Bokeh performs a validation step
when outputting a visualization for display. These errors and warnings are
outlined below.

.. contents::
    :local:
    :depth: 1

.. _bokeh.validation.errors:

``bokeh.validation.errors``
---------------------------

.. automodule:: bokeh.validation.errors
   :members:
   :undoc-members:


.. _bokeh.validation.warnings:

``bokeh.validation.warnings``
-----------------------------

.. automodule:: bokeh.validation.warnings
   :members:
   :undoc-members:


.. _bokeh.validation.decorators:

``bokeh.validation.decorators``
-------------------------------

.. autofunction:: bokeh.validation.decorators.error

.. autofunction:: bokeh.validation.decorators.warning


.. _bokeh.validation.exceptions:

``bokeh.validation.exceptions``
-------------------------------

.. automodule:: bokeh.validation.exceptions
   :members:
   :undoc-members:

.. |bokeh.charts| replace:: :ref:`bokeh.plotting <bokeh.charts>`
.. |bokeh.models| replace:: :ref:`bokeh.plotting <bokeh.plotting>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |ColumnDataSource| replace:: :class:`~bokeh.models.sources.ColumnDataSource`
.. |GlyphRenderer| replace:: :class:`~bokeh.models.renderers.GlyphRenderer`
.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`
