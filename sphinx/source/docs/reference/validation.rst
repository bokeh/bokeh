
.. _bokeh.core.validation:

``bokeh.core.validation``
=========================

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

.. _bokeh.core.validation.errors:

``bokeh.core.validation.errors``
--------------------------------

.. automodule:: bokeh.core.validation.errors
   :members:
   :undoc-members:


.. _bokeh.core.validation.warnings:

``bokeh.core.validation.warnings``
----------------------------------

.. automodule:: bokeh.core.validation.warnings
   :members:
   :undoc-members:


.. _bokeh.core.validation.decorators:

``bokeh.core.validation.decorators``
------------------------------------

.. autofunction:: bokeh.core.validation.decorators.error

.. autofunction:: bokeh.core.validation.decorators.warning


.. _bokeh.core.validation.exceptions:

``bokeh.core.validation.exceptions``
------------------------------------

.. automodule:: bokeh.core.validation.exceptions
   :members:
   :undoc-members:

.. |bokeh.charts| replace:: :ref:`bokeh.plotting <bokeh.charts>`
.. |bokeh.models| replace:: :ref:`bokeh.plotting <bokeh.plotting>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |ColumnDataSource| replace:: :class:`~bokeh.models.sources.ColumnDataSource`
.. |GlyphRenderer| replace:: :class:`~bokeh.models.renderers.GlyphRenderer`
.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`
