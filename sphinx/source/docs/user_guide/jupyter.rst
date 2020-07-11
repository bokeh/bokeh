.. _userguide_jupyter:

Using with Jupyter
==================

.. _userguide_jupyter_notebook:

Working in Notebooks
--------------------

`Jupyter`_ notebooks are computable documents often used for exploratory work,
data analysis, teaching, and demonstration. A notebook is a series of *input
cells* that can be individually executed to display their output immediately
after the cell. In addition to  *Classic* notebooks, there are also notebooks for
the newer *JupyterLab* project. Bokeh can embed both standalone and Bokeh server
content with either.

.. _Jupyter:  https://jupyter.org

.. _userguide_jupyter_notebook_inline_plots:

Standalone Output
~~~~~~~~~~~~~~~~~

Standalone Bokeh content (i.e. that does not use a Bokeh server) can be embedded
directly in classic Jupyter notebooks as well as in JupyterLab.

Classic Notebook
++++++++++++++++

To display Bokeh plots inline in a classic Jupyter notebook, use the
|output_notebook| function from |bokeh.io| instead of (or in addition to)
the |output_file| function we have seen previously. No other modifications
are required. When |show| is called, the plot will be displayed inline in
the next notebook output cell. You can see a Jupyter screenshot below:

.. image:: /_images/notebook_inline.png
    :scale: 50 %
    :align: center

Multiple plots can be displayed in a single notebook output cell by calling
|show| multiple times in the input cell. The plots will be displayed in order.

.. image:: /_images/notebook_inline_multiple.png
    :scale: 50 %
    :align: center

JupyterLab
++++++++++

In order to embed Bokeh plots inside of JupyterLab, you need to install
the two JupyterLab extensions. First, install *jupyterlab-manager* by running
the following command:

.. code:: sh

    jupyter labextension install @jupyter-widgets/jupyterlab-manager

And then similarly install the *jupyter_bokeh* extension:

.. code:: sh

    jupyter labextension install @bokeh/jupyter_bokeh

Once this is installed, usage is the same as with classic notebooks above.

.. image:: /_images/joyplot_jupyter_lab.png
    :scale: 25 %
    :align: center

Bokeh Server Applications
~~~~~~~~~~~~~~~~~~~~~~~~~

It is also possible to embed full Bokeh server applications that can connect
plot events and Bokeh's built-in widgets directly to Python callback code.
See :ref:`userguide_server` for general information about Bokeh server
applications, and the following notebook for a complete example of a Bokeh
application embedded in a Jupyter notebook:

* :bokeh-tree:`examples/howto/server_embed/notebook_embed.ipynb`

JupyterHub
++++++++++

In order to embed Bokeh server applications when running notebooks from your own
JupyterHub instance, some additional steps are necessary to enable network
connectivity between the client browser and the Bokeh server running in the
JupyterLab cell. This is because your browser needs to connect to the port the
Bokeh server is listening on, but JupyterHub is acting as a reverse proxy
between your browser and your JupyterLab container. Follow all the JupyterLab
instructions above, then continue with the following steps below.

First, you must install the ``nbserverproxy`` server extension. This can be done
by running the command:

.. code:: sh

    pip install nbserverproxy && jupyter serverextension enable --py nbserverproxy

Second, you must define a function to help create the URL that the browser
uses to connect to the Bokeh server. This will be passed into |show| in
the final step. A reference implementation is provided here, although you
must either modify it or define the environment variable ``EXTERNAL_URL``
to the URL of your JupyterHub installation. By default, JupyterHub will set
``JUPYTERHUB_SERVICE_PREFIX``.

.. code-block:: python

    def remote_jupyter_proxy_url(port):
        """
        Callable to configure Bokeh's show method when a proxy must be
        configured.

        If port is None we're asking about the URL
        for the origin header.
        """
        base_url = os.environ['EXTERNAL_URL']
        host = urllib.parse.urlparse(base_url).netloc

        # If port is None we're asking for the URL origin
        # so return the public hostname.
        if port is None:
            return host

        service_url_path = os.environ['JUPYTERHUB_SERVICE_PREFIX']
        proxy_url_path = 'proxy/%d' % port

        user_url = urllib.parse.urljoin(base_url, service_url_path)
        full_url = urllib.parse.urljoin(user_url, proxy_url_path)
        return full_url

Finally, you can pass the function you defined in step 2 to |show|
as the notebook_url keyword argument, which Bokeh will call while
setting up the server and creating the URL for loading the graph:

.. code-block:: python

    show(obj, notebook_url=remote_jupyter_proxy_url)

At this point, the Bokeh graph should load and execute python
callbacks defined in your JupyterLab environment.

Trusting Notebooks
~~~~~~~~~~~~~~~~~~

Depending on the version of the notebook in use, it may be necessary to
"trust" the notebook in order for Bokeh plots to re-render when the
notebook is closed and subsequently re-opened. The "Trust Notebook" option
is typically located under the "File" menu:

.. image:: /_images/notebook_trust.png
    :scale: 50 %
    :align: center

.. _userguide_jupyter_notebook_slides:

Notebook Slides
~~~~~~~~~~~~~~~

It is possible to use a notebook in conjunction with `Reveal.js`_
to generate slideshows from notebook cell content. It is also possible to
include standalone (i.e. non-server) Bokeh plots in such sideshows, however,
some steps must be followed to correctly display the output. Primarily: **the
cell containing** ``output_notebook`` **must be not be skipped**.

The rendered cell output of the ``output_notebook`` call is responsible
for making sure the BokehJS library is loaded. Without that, Bokeh plots
cannot function. If this cell type is marked *"skip"* then BokehJS will
not be loaded, and Bokeh plots will not display. An alternative, if you
wish to hide this cell, is to mark it as the *"notes"* slide type.

.. _userguide_jupyter_notebook_notebook_handles:

Notebook Handles
~~~~~~~~~~~~~~~~

It is possible to update a previously shown plot in place. When the argument
``notebook_handle=True`` is passed to |show|, a handle object is returned.
This handle object can be used with the |push_notebook| function to update
the plot with any recent changes to plots properties, data source values, etc.
This `notebook handle` functionality is only supported in classic Jupyter
notebooks and is not implemented in JupyterLab or Zeppelin yet.

The following screenshots walk through the basic usage of notebook handles.

First, import standard functions, as well as |push_notebook|:

.. image:: /_images/notebook_comms1.png
    :scale: 50 %
    :align: center

Next, create some plots, and make sure to pass ``notebook_handle=True`` to
|show|:

.. image:: /_images/notebook_comms2.png
    :scale: 50 %
    :align: center

Looking at the handle, see that it is associated with the output cell for
``In[2]`` that was just displayed:

.. image:: /_images/notebook_comms3.png
    :scale: 50 %
    :align: center

Now, update any properties of the plot, then call |push_notebook| with the
handle:

.. image:: /_images/notebook_comms4.png
    :scale: 50 %
    :align: center

After doing so, note that the earlier output cell for ``In[2]`` has changed
(*without* being re-executed)

.. image:: /_images/notebook_comms5.png
    :scale: 50 %
    :align: center

More detailed demonstrations of using notebook handles can be found in the
following example notebooks:

* :bokeh-tree:`examples/howto/notebook_comms/Basic Usage.ipynb`
* :bokeh-tree:`examples/howto/notebook_comms/Continuous Updating.ipynb`
* :bokeh-tree:`examples/howto/notebook_comms/Jupyter Interactors.ipynb`
* :bokeh-tree:`examples/howto/notebook_comms/Numba Image Example.ipynb`

.. _userguide_jupyter_notebook_jupyter_interactors:

Jupyter Interactors
~~~~~~~~~~~~~~~~~~~

It is possible to drive updates to Bokeh plots using notebook widgets,
known as `interactors`_. The key to doing this is the |push_notebook| function
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

.. _interactors: http://ipywidgets.readthedocs.io/en/latest/examples/Using%20Interact.html
.. _Reveal.js: http://lab.hakim.se/reveal-js/#/

More Example Notebooks
~~~~~~~~~~~~~~~~~~~~~~

Many more examples using notebook can be found in the `bokeh-notebook`_
repository. First, clone the repository locally:

.. code:: sh

    git clone https://github.com/bokeh/bokeh-notebooks.git

Then, launch the Jupyter notebooks in your web browser. Alternatively, live notebooks
that can be run immediately online are hosted by `Binder`_.

Additionally, there are some notebooks under `examples`_ in the main `Bokeh`_
repo:

- `categorical data`_
- `hover callback`_
- `linked panning`_
- `range update callback`_
- `embed server in notebook`_
- `US marriages and divorces interactive`_
- `color scatterplot`_
- `glyphs`_

Notebook comms examples:

- `basic usage`_
- `continuous updating`_
- `Jupyter interactors`_
- `Numba image example`_

.. _bokeh-notebook: https://github.com/bokeh/bokeh-notebooks
.. _Binder: https://mybinder.org/v2/gh/bokeh/bokeh-notebooks/master?filepath=tutorial%2F00%20-%20Introduction%20and%20Setup.ipynb
.. _examples: https://github.com/bokeh/bokeh/tree/master/examples
.. _Bokeh: https://github.com/bokeh/bokeh
.. _categorical data: https://github.com/bokeh/bokeh/blob/master/examples/howto/Categorical%20Data.ipynb
.. _hover callback: https://github.com/bokeh/bokeh/blob/master/examples/howto/Hover%20callback.ipynb
.. _linked panning: https://github.com/bokeh/bokeh/blob/master/examples/howto/Linked%20panning.ipynb
.. _range update callback: https://github.com/bokeh/bokeh/blob/master/examples/howto/Range%20update%20callback.ipynb
.. _embed server in notebook: https://github.com/bokeh/bokeh/blob/master/examples/howto/server_embed/notebook_embed.ipynb
.. _US marriages and divorces interactive: https://github.com/bokeh/bokeh/blob/master/examples/howto/us_marriages_divorces/us_marriages_divorces_interactive.ipynb
.. _color scatterplot: https://github.com/bokeh/bokeh/blob/master/examples/plotting/notebook/color_scatterplot.ipynb
.. _glyphs: https://github.com/bokeh/bokeh/blob/master/examples/plotting/notebook/glyphs.ipynb
.. _basic usage: https://github.com/bokeh/bokeh/blob/master/examples/howto/notebook_comms/Basic%20Usage.ipynb
.. _continuous updating: https://github.com/bokeh/bokeh/blob/master/examples/howto/notebook_comms/Continuous%20Updating.ipynb
.. _Jupyter interactors: https://github.com/bokeh/bokeh/blob/master/examples/howto/notebook_comms/Jupyter%20Interactors.ipynb
.. _Numba image example: https://github.com/bokeh/bokeh/blob/master/examples/howto/notebook_comms/Numba%20Image%20Example.ipynb

.. _userguide_jupyter_ipywidgets:

IPyWidgets outside the Notebook
-------------------------------

In the previous section, we learned how to use Bokeh in JupyterLab and classical
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

To run this, assuming the code is saved under ``ipy_slider.py``, we issue
``bokeh serve ipy_slider.py`` (see :ref:`userguide_server` for details). The
application is available at http://localhost:5006/ipy_slider.

From here, one can create more complex layouts and include advanced widgets,
like `ipyleaflet`_, `ipyvolume`_, etc. More examples are available in the Bokeh
repository under ``examples/howto/ipywidgets``.

.. _IPyWidgets: https://ipywidgets.readthedocs.io
.. _ipywidgets_bokeh: https://github.com/bokeh/ipywidgets_bokeh
.. _ipyleaflet: https://jupyter.org/widgets#ipyleaflet
.. _ipyvolume: https://jupyter.org/widgets#ipyvolume
