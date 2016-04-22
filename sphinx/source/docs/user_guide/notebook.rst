.. _userguide_notebook:

Working in the Notebook
=======================

.. _userguide_notebook_inline_plots:

Inline Plots
------------

To display Bokeh plots inline in an Jupyter notebook, use the
|output_notebook| function from |bokeh.io| instead of (or in addition to)
the |output_file| function we have seen previously. No other modifications
are required. You can see an example below:

.. image:: /_images/notebook_inline.png
    :scale: 50 %
    :align: center

.. note::
    As a convenience, |output_notebook| is also importable from the
    |bokeh.charts| and |bokeh.plotting| modules.

.. _userguide_notebook_jupyter_interactors:

Jupyter Interactors
-------------------

It is possible to drive updates to Bokeh plots using Jupyter
notebook widgets, known as interactors. The key doing this is the
|push_notebook| function. This function allows you to update document
data and properties in the notebook, so that any plots, etc are made to
update. A common use of |push_notebook| is in an update callback for
interactors. An example is shown below:

.. warning::
    Currently, ``push_notebook`` always updates only the ***last shown
    object***.

.. image:: /_images/notebook_interactors.png
    :scale: 50 %
    :align: center


.. |bokeh.io| replace:: :ref:`bokeh.io <bokeh.io>`
.. |bokeh.charts| replace:: :ref:`bokeh.charts <bokeh.charts>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`


.. |output_notebook| replace:: :func:`~bokeh.io.output_notebook`
.. |output_file| replace:: :func:`~bokeh.io.output_file`


.. |ColumnDataSource| replace:: :class:`~bokeh.models.sources.ColumnDataSource`
.. |push_notebook| replace:: :func:`~bokeh.io.push_notebook`
