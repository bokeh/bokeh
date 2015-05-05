.. _userguide_notebook:

Working in the Notebook
=======================

.. contents::
    :local:
    :depth: 2

Displaying Inline Plots
-----------------------

To display Bokeh plots inline in an IPython/Jupyter notebook, use the
|output_notebook| function from |bokeh.io| instead of (or in addition to)
the |output_file| function we have seen previously. No other modifications
are required. You can see an example below:

.. image:: /_images/notebook_inline.png
    :scale: 50 %
    :align: center

.. note::
    As a convenience, |output_notebook| is also importable from the
    |bokeh.charts| and |bokeh.plotting| modules.

Connecting to Bokeh Server Plots
--------------------------------


Integrating IPython Interactors
-------------------------------

It is possible to drive updates to Bokeh plots using IPython/Jupyter
notebook widgets, known as interactors. The key doing this is the
|push_notebook| method on |ColumnDataSource|. This method allows you to
update plot data sources in the notebook, so that the plot is made to
update. Typically, |push_notebook| is used in the update callback for the
interactor. An example is shown below:

.. image:: /_images/notebook_interactors.png
    :scale: 50 %
    :align: center


.. |bokeh.io| replace:: :ref:`bokeh.io <bokeh.io>`
.. |bokeh.charts| replace:: :ref:`bokeh.charts <bokeh.charts>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`


.. |output_notebook| replace:: :func:`~bokeh.io.output_notebook`
.. |output_file| replace:: :func:`~bokeh.io.output_file`


.. |ColumnDataSource| replace:: :class:`~bokeh.models.sources.ColumnDataSource`
.. |push_notebook| replace:: :func:`~bokeh.models.sources.ColumnDataSource.push_notebook`
