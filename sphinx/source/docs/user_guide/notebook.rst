.. _userguide_notebook:

Working in the Notebook
=======================

.. _userguide_notebook_inline_plots:

Inline Plots
------------

To display Bokeh plots inline in an Jupyter/Zeppelin notebook, use the
|output_notebook| function from |bokeh.io| instead of (or in addition to)
the |output_file| function we have seen previously. No other modifications
are required. When |show| is called, the plot will be displayed inline in
the next notebook output cell. You can see a Jupyter screenshot below:

.. image:: /_images/notebook_inline.png
    :scale: 50 %
    :align: center

By defaults, |output_notebook| apply to Juypter. If you want to use bokeh
to display inline plots in Zeppelin, you need to specify `notebook_type`
to `zeppelin` in |output_notebook|. Here's one Zeppelin screenshot.

.. image:: /_images/bokeh_simple_test_zeppelin.png
    :scale: 50 %
    :align: center

.. _userguide_notebook_slides:

Notebook Slides
---------------

It is possible to use the Jupyter notebook in conjunction with `Reveal.js`_
to generate slideshows from notebook cell content. It is also possible to
include standalone (i.e. non-server) Bokeh plots in such sideshows, however
some steps must be followed for output to correctly display. Primarily:

**The cell containing** ``output_notebook`` **must not be skipped**.

The rendered cell output of the ``output_notebook`` call is responsible
for making sure the BokehJS library is loaded. Without that, Bokeh plots
cannot function. If this cell type is marked *"skip"* then BokehJS will
not be loaded, and Bokeh plots will not display. An alternative, if you
wish to hide this cell, is to mark it as the *"notes"* slide type.

.. _userguide_notebook_notebook_handles:

Notebook Handles
----------------

It is possible to update a previously shown plot in-place. When the argument
``notebook_handle=True`` is passed to |show| then a handle object is returned.
This handle object can be used with the |push_notebook| function to update
the plot with any recent changes to plots properties, data source values, etc.
But `notebook handle` is only supported in Jupyter, not supported by Zeppelin yet.

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

.. |output_notebook| replace:: :func:`~bokeh.io.output_notebook`
.. |output_file| replace:: :func:`~bokeh.io.output_file`

.. |ColumnDataSource| replace:: :class:`~bokeh.models.sources.ColumnDataSource`
.. |push_notebook| replace:: :func:`~bokeh.io.push_notebook`
.. |show| replace:: :func:`~bokeh.io.show`

.. _Reveal.js: http://lab.hakim.se/reveal-js/#/

.. _interactors: http://ipywidgets.readthedocs.io/en/latest/examples/Using%20Interact.html
