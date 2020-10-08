.. _userguide_jupyter:

Using with Jupyter
==================

.. _userguide_jupyter_notebook:

Working in notebooks
--------------------

`Jupyter`_ notebooks are computable documents often used for exploratory work,
data analysis, teaching, and demonstration. A notebook is a series of *input
cells* that can execute individually to immediately display their output. In
addition to  *Classic* notebooks, there are also notebooks for the newer
*JupyterLab* project. Bokeh can embed both standalone and Bokeh server content
with either.

.. _Jupyter:  https://jupyter.org

.. _userguide_jupyter_notebook_inline_plots:

Standalone output
~~~~~~~~~~~~~~~~~

Standalone Bokeh content doesn't require a Bokeh server and can be embedded
directly in classic Jupyter notebooks as well as in JupyterLab.

Classic notebooks
+++++++++++++++++

To display Bokeh plots inline in a classic Jupyter notebook, use the
|output_notebook| function from |bokeh.io| instead of (or in addition to)
the |output_file| function. No other modifications are required. When you
call |show|, the plot will display inline in the next notebook output cell.
See a screenshot of Jupyter below:

.. image:: /_images/notebook_inline.png
    :scale: 50 %
    :align: center

To have a single notebook output cell display multiple plots, call |show|
multiple times in the input cell. The plots will display in order.

.. image:: /_images/notebook_inline_multiple.png
    :scale: 50 %
    :align: center

JupyterLab
++++++++++

To embed Bokeh plots in JupyterLab, you'll need the following two JupyterLab extensions:

1. First install *jupyterlab-manager* with this command:

   .. code::

    jupyter labextension install @jupyter-widgets/jupyterlab-manager

2. Then install the *jupyter_bokeh* extension as follows:

   .. code::

    jupyter labextension install @bokeh/jupyter_bokeh

The rest is the same as with classic notebooks above.

.. image:: /_images/joyplot_jupyter_lab.png
    :scale: 25 %
    :align: center

Bokeh server applications
~~~~~~~~~~~~~~~~~~~~~~~~~

You can also embed full Bokeh server applications connecting plot events
and Bokeh's built-in widgets directly to Python callback code.
See :ref:`userguide_server` for general information about Bokeh server
applications. For a complete example of a Bokeh application embedded in
a Jupyter notebook, refer to the following notebook:

* :bokeh-tree:`examples/howto/server_embed/notebook_embed.ipynb`

JupyterHub
++++++++++

When running notebooks from your own JupyterHub instance, some additional
steps are necessary to embed Bokeh server applications and to enable network
connectivity between the client browser and the Bokeh server running in a
JupyterLab cell. This is because your browser needs to connect to the port the
Bokeh server is listening on. However, JupyterHub is acting as a reverse proxy
between your browser and your JupyterLab container. Follow all the JupyterLab
instructions above, then continue with the following steps:

1. Install the ``nbserverproxy`` server extension as follows:

   .. code:: sh

    pip install nbserverproxy && jupyter serverextension enable --py nbserverproxy

2. Define a function to help create the URL for the browser to connect to
   the Bokeh server.

   See below for a reference implementation. You'll have to either modify
   this code or assign the URL of your JupyterHub installation to the environment
   variable ``EXTERNAL_URL``. JupyterHub defaults to ``JUPYTERHUB_SERVICE_PREFIX``
   in this case.

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

3. Pass the function you defined in step 2 to the |show| function
   as the notebook_url keyword argument, which Bokeh will call while
   setting up the server and creating the URL to load a graph:

   .. code-block:: python

    show(obj, notebook_url=remote_jupyter_proxy_url)

Now the Bokeh graph should load and execute python
callbacks defined in your JupyterLab environment.

Trusting notebooks
~~~~~~~~~~~~~~~~~~

Depending on the version of the notebook you are using, you may have to
`trust the notebook <https://jupyter-notebook.readthedocs.io/en/stable/security.html#explicit-trust>`_
for Bokeh plots to re-render when the notebook is closed and re-
opened. The **Trust Notebook** option is typically located under the
**File** menu:

.. image:: /_images/notebook_trust.png
    :scale: 50 %
    :align: center

.. _userguide_jupyter_notebook_slides:

Notebook slides
~~~~~~~~~~~~~~~

You can use a notebook with `Reveal.js`_ to generate slideshows from cells.
You can also include standalone (i.e. non-server) Bokeh plots in such sideshows.
However, you will need to take a few extra steps to display the output correctly.
Particularly, make sure that **the cell containing the** ``output_notebook``
**is not be skipped**.

Rendered cell output of the ``output_notebook`` call ensures that the
BokehJS library loads. Otherwise, Bokeh plots will not work. If this cell's
type is set to *"skip"*, BokehJS will not load, and Bokeh plots will not display.
If you want to hide this cell, assign it the *"notes"* slide type.

.. _userguide_jupyter_notebook_notebook_handles:

Notebook handles
~~~~~~~~~~~~~~~~

You can update a displayed plot without reloading it. To do so, pass the
``notebook_handle=True`` argument to |show| for it to return a handle object.
You can use this handle object with the |push_notebook| function to update the plot
with any recent changes to plots properties, data source values, etc.

This `notebook handle` functionality is only supported in classic Jupyter notebooks
and is not implemented in JupyterLab or Zeppelin yet.

The following screenshots illustrate basic usage of notebook handles:

1. Import standard functions and |push_notebook|:

.. image:: /_images/notebook_comms1.png
    :scale: 50 %
    :align: center

2. Create some plots and pass ``notebook_handle=True`` to |show|:

.. image:: /_images/notebook_comms2.png
    :scale: 50 %
    :align: center

3. Check that the handle is associated with the output cell for ``In[2]`` just displayed:

.. image:: /_images/notebook_comms3.png
    :scale: 50 %
    :align: center

4. Update some properties of the plot, then call |push_notebook| with the handle:

.. image:: /_images/notebook_comms4.png
    :scale: 50 %
    :align: center

5. Note that the output cell for ``In[2]`` has changed (*without* being re-executed):

.. image:: /_images/notebook_comms5.png
    :scale: 50 %
    :align: center

See the following notebooks for more detailed examples of notebook handle use:

* :bokeh-tree:`examples/howto/notebook_comms/Basic Usage.ipynb`
* :bokeh-tree:`examples/howto/notebook_comms/Continuous Updating.ipynb`
* :bokeh-tree:`examples/howto/notebook_comms/Jupyter Interactors.ipynb`
* :bokeh-tree:`examples/howto/notebook_comms/Numba Image Example.ipynb`

.. _userguide_jupyter_notebook_jupyter_interactors:

Jupyter interactors
~~~~~~~~~~~~~~~~~~~

You can use notebook widgets, known as `interactors`_, to update
Bokeh plots. The key to doing this is the |push_notebook| function.
The update callback for the interactors calls this function
to update the plot from widget values. See a screenshot of the
:bokeh-tree:`examples/howto/notebook_comms/Jupyter Interactors.ipynb` example
notebook below:

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

More example notebooks
~~~~~~~~~~~~~~~~~~~~~~

You can find many more examples of notebook use in the `bokeh-notebook`_ repository:

1. Clone the repository locally:

   .. code:: sh

    git clone https://github.com/bokeh/bokeh-notebooks.git

2. Launch the Jupyter notebooks in your web browser.

Alternatively, `Binder`_ hosts live notebooks that you can run online.

The main `Bokeh`_ repo also includes some notebooks under `examples`_:

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

IPyWidgets outside the notebook
-------------------------------

Now that you know how to use Bokeh in the JupyterLab and classical notebook environments,
you might want to take advantage of the vibrant Jupyter ecosystem outside of these environments.
You can do so with the `ipywidgets_bokeh`_ extension for Bokeh:

.. code-block:: sh

    $ conda install -c bokeh ipywidgets_bokeh

or

.. code-block:: sh

    $ pip install ipywidgets_bokeh

This extension lets you use `IPyWidgets`_ in Bokeh. Simply wrap a widget in an
``IPyWidget`` model and add the wrapper to a document or include it in a layout.
You don't have to install or enable any other extensions.

Example
~~~~~~~

For example, try building an application with a single Jupyter slider that logs its
adjustments to the console:

1. Start by constructing a widget and configuring an observer:

   .. code-block:: python

    from ipywidgets import FloatSlider
    angle = FloatSlider(min=0, max=360, value=0, step=1, description="Angle")

    def on_change(change):
        print(f"angle={change['new']} deg")
    angle.observe(on_change, names="value")

2. To integrate the widget with Bokeh, wrap it in ``IPyWidget``:

   .. code-block:: python

    from ipywidgets_bokeh import IPyWidget
    ipywidget = IPyWidget(widget=angle)

3. Add the wrapper to a Bokeh document:

   .. code-block:: python

    from bokeh.plotting import curdoc
    doc = curdoc()
    doc.add_root(ipywidget)

To run the app, enter ``bokeh serve ipy_slider.py``, where ``ipy_slider.py``
is the name of the application (see :ref:`userguide_server` for details).
This application is available at http://localhost:5006/ipy_slider.

You can build on the above to create more complex layouts and include advanced widgets,
such as `ipyleaflet`_ and `ipyvolume`_. For more examples, see ``examples/howto/ipywidgets``
in the Bokeh repository.

.. _IPyWidgets: https://ipywidgets.readthedocs.io
.. _ipywidgets_bokeh: https://github.com/bokeh/ipywidgets_bokeh
.. _ipyleaflet: https://jupyter.org/widgets#ipyleaflet
.. _ipyvolume: https://jupyter.org/widgets#ipyvolume
