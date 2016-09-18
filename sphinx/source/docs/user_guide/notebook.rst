.. _userguide_notebook:

Working in the Notebook
=======================

.. _userguide_notebook_inline_plots:

Inline Plots
------------

To display Bokeh plots inline in an Jupyter notebook, use the
|output_notebook| function from |bokeh.io| instead of (or in addition to)
the |output_file| function we have seen previously. No other modifications
are required. When |show| is called, the plot will be displayed inline in
the next notebook output cell. You can see a screenshot below:

.. image:: /_images/notebook_inline.png
    :scale: 50 %
    :align: center

.. note::
    As a convenience, |output_notebook| is also importable from the
    |bokeh.charts| and |bokeh.plotting| modules.

.. _userguide_notebook_notebook_handles:

Notebook Handles
----------------

It is possible to update a previously shown plot in-place. When the argument
``notebook_handle=True`` is passed to |show| then a handle object is returned.
This handle object can be used with the |push_notebook| function to update
the plot with any recent changes to plots properties, data source values, etc.

The following screenshots walk through the basic usage of notebook handles.

* First, import standard functions, as well as |push_notebook|:

.. image:: /_images/notebook_comms1.png
    :scale: 40 %
    :align: center

* Next, create some plots, and make sure to pass ``notebook_handle=True``
  to |show|:

.. image:: /_images/notebook_comms2.png
    :scale: 40 %
    :align: center

* Looking at the handle, see that it is associated with the output cell
  for ``In[2]`` that was just displayed:

.. image:: /_images/notebook_comms3.png
    :scale: 40 %
    :align: center

* Now, update any properties of the plot, then call |push_notebook| with
  the handle:

.. image:: /_images/notebook_comms4.png
    :scale: 40 %
    :align: center

* After doing so, note that the earlier output cell for ``In[2]`` has
  changed (*without* being re-executed)

.. image:: /_images/notebook_comms5.png
    :scale: 40 %
    :align: center


More detailed demonstrations of using notebook handles can be found
in the following example notebooks:

* :bokeh-tree:`examples/howto/notebook_comms/Basic Usage.ipynb`
* :bokeh-tree:`examples/howto/notebook_comms/Jupyter Interactors.ipynb`

.. _userguide_notebook_jupyter_interactors:

Jupyter Interactors
-------------------

It is possible to drive updates to Bokeh plots using Jupyter notebook widgets,
known as `interactors`_. The key doing this is the |push_notebook| function
described above. Typically it is called in the update callback for the
interactors, to update the plot from widget values. A screenshot of the
:bokeh-tree:`examples/howto/notebook_comms/Jupyter Interactors.ipynb` example
notebook is shown below:

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
.. |show| replace:: :func:`~bokeh.io.show`

.. _interactors: http://ipywidgets.readthedocs.io/en/latest/examples/Using%20Interact.html
