.. _userguide_jupyter:

Integrating with the Jupyter ecosystem
======================================

.. _userguide_jupyter_ipywidgets:

Using IPyWidgets in Bokeh applications
--------------------------------------

In the previous section we learnt how to use Bokeh in JupyterLab and classical
notebook environments. Suppose we would like to do the opposite and take
advantage of the vibrant Jupyter ecosystem, in particular `IPyWidgets`_, in
a Bokeh application, outside the confines of those environments. This can be
achieved with help from `ipywidgets_bokeh`_ extension to Bokeh:

.. code-block:: sh

    $ conda install -c bokeh ipywidgets_bokeh

or

.. code-block:: sh

    $ pip install ipywidgets_bokeh

Then you can use an IPyWidget in Bokeh, by simply wrapping it in ``IPyWidget``
model and adding the wrapper to a document or including it in a layout. Given
that this is run outside Jupyter, there is no need for installing and/or
enabling any extensions.

Example
~~~~~~~

Suppose we would like to create an application with a single Jupyter slider
and log its value to the console, as the slider is manipulated. We start by
constructing the widget and configuring an observer, the same as we would
do in Jupyter:

.. code-block:: python

    from ipywidgets import FloatSlider
    angle = FloatSlider(min=0, max=360, value=0, step=1, description="Angle")

    def on_change(change):
        print(f"angle={change['new']} deg")
    angle.observe(on_change, names="value")

To integrate the widget with Bokeh, we have to wrap it in ``IPyWidget``:

.. code-block:: python

    from ipywidgets_bokeh import IPyWidget
    ipywidget = IPyWidget(widget=angle)

Then we add the wrapper to a Bokeh document:

.. code-block:: python

    from bokeh.plotting import curdoc
    doc = curdoc()
    doc.add_root(ipywidget)

To to run this, assuming the code is saved under ``ipy_slider.py``, we issue
``bokeh serve ipy_slider.py`` (see :ref:`userguide_server` for details). The
application is available at http://localhost:5006/ipy_slider.

From here, one can create more complex layouts and include advanced widgets,
like `ipyleaflet`_, `ipyvolume`_, etc.

.. _IPyWidgets: https://ipywidgets.readthedocs.io
.. _ipywidgets_bokeh: https://github.com/bokeh/ipywidgets_bokeh
.. _ipyleaflet: https://jupyter.org/widgets#ipyleaflet
.. _ipyvolume: https://jupyter.org/widgets#ipyvolume
