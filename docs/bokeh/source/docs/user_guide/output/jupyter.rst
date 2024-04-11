.. _ug_output_jupyter:

Jupyter
=======

.. _ug_output_jupyter_notebook:

Working in notebooks
--------------------

`Jupyter`_ notebooks are computable documents often used for exploratory work,
data analysis, teaching, and demonstration. A notebook is a series of *input
cells* that can execute individually to immediately display their output. In
addition to  *Classic* notebooks, there are also notebooks for the newer
*JupyterLab* project. Bokeh can embed both standalone and Bokeh server content
with either.

.. _Jupyter:  https://jupyter.org

.. _ug_output_jupyter_notebook_inline_plots:

Standalone output
~~~~~~~~~~~~~~~~~

Standalone Bokeh content doesn't require a Bokeh server and can be embedded
directly in classic Jupyter notebooks as well as in JupyterLab.

Classic notebooks
'''''''''''''''''

To display Bokeh plots inline in a classic Jupyter notebook, use the
|output_notebook| function from |bokeh.io| instead of (or in addition to)
the |output_file| function. No other modifications are required. When you
call |show|, the plot will display inline in the next notebook output cell.
See a screenshot of Jupyter below:

.. image:: /_images/notebook_inline.png
    :scale: 50 %
    :align: center
    :alt: Screenshot of a Jupyter notebook displaying a Bokeh scatterplot inline after calling show().

To have a single notebook output cell display multiple plots, call |show|
multiple times in the input cell. The plots will display in order.

.. image:: /_images/notebook_inline_multiple.png
    :scale: 50 %
    :align: center
    :alt:  Screenshot of a Jupyter notebook displaying multiple Bokeh scatterplots inline after calling show() multiple times.

JupyterLab
''''''''''

To use JupyterLab with Bokeh, you should at least use version 3.0 of JupyterLab.
Enabling Bokeh visualizations in JupyterLab also requires the
`jupyter_bokeh`_ extension to be installed.

After installing JupyterLab, you can use either ``pip`` or ``conda`` to install
jupyter_bokeh:

.. grid:: 1 1 2 2

    .. grid-item-card::

        Installing with ``conda``
        ^^^

        Make sure you have either `Anaconda`_ or `Miniconda`_ installed. Use
        this command to install jupyter_bokeh:

        .. code-block:: sh

            conda install jupyter_bokeh

    .. grid-item-card::

        Installing with ``pip``
        ^^^

        Use this command to install jupyter_bokeh:

        .. code-block:: sh

            pip install jupyter_bokeh

For instructions on installing jupyter_bokeh with versions of JupyterLab
older than 3.0, see the `README`_ in the GitHub repository of `jupyter_bokeh`_.

Once you have jupyter_bokeh installed, you can use Bokeh just like you would
with a :ref:`classic notebook <ug_output_jupyter_notebook_inline_plots>`.

.. image:: /_images/ridgeplot_jupyter_lab.png
    :scale: 25 %
    :align: center
    :alt: Screenshot of Jupyterlab with a Bokeh ridgeplot displayed inline.

.. _jupyter_bokeh: https://github.com/bokeh/jupyter_bokeh
.. _Anaconda: https://www.anaconda.com/products/individual#Downloads
.. _Miniconda: https://docs.conda.io/en/latest/miniconda.html
.. _README: https://github.com/bokeh/jupyter_bokeh/blob/main/README.md

Bokeh server applications
~~~~~~~~~~~~~~~~~~~~~~~~~

You can also embed full Bokeh server applications connecting plot events
and Bokeh's built-in widgets directly to Python callback code.
See :ref:`ug_server` for general information about Bokeh server
applications. For a complete example of a Bokeh application embedded in
a Jupyter notebook, refer to the following notebook:

* :bokeh-tree:`examples/server/api/notebook_embed.ipynb`

JupyterHub
''''''''''

When running notebooks from your own JupyterHub instance, some additional
steps are necessary to embed Bokeh server applications and to enable network
connectivity between the client browser and the Bokeh server running in a
JupyterLab cell. This is because your browser needs to connect to the port the
Bokeh server is listening on. However, JupyterHub is acting as a reverse proxy
between your browser and your JupyterLab container.

Bokeh solves this problem by providing a notebook_url parameter which can be
passed a callable to compute the final URL based on an integer port.  Further,
if the JupyterHub admin defines the environment variable
``JUPYTER_BOKEH_EXTERNAL_URL`` the process of defining notebook_url becomes
fully automatic and ``notebook_url`` no longer needs to be specified.  This has
the advantage that the same notebook will run unmodified both on JupyterHub
and in a standalone JupyterLab session.

Required Dependencies
~~~~~~~~~~~~~~~~~~~~~

Follow all the JupyterLab (not JupyterHub) instructions above, then continue by
installing the ``jupyter-server-proxy`` package and enable the server extension as follows:

.. code:: sh

    pip install jupyter-server-proxy && jupyter server extension enable --py jupyter-server-proxy

If you intend to work with JupyterLab you need to install the corresponding extension,
either from the GUI or with the following command:

.. code:: sh

    jupyter labextension install @jupyterlab/server-proxy

JupyterHub for Administrators
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If you are a JupyterHub admin you can make Bokeh work automatically with
unchanged notebooks by setting an environment variable in the notebook
environment:

.. code:: sh

   export JUPYTER_BOKEH_EXTERNAL_URL="https//our-hub.science.edu"

Often this is done in JupyterHub Helm chart configuration YAML like this:

.. code-block:: yaml

   hub:
     single_user:
       extraEnv:
         JUPYTER_BOKEH_EXTERNAL_URL="https://our-public-hub-name.edu"

The net effect of the above is that the techniques of the next section are
automatically used by bokeh and no additional actions are required.

JupyterHub for Users
~~~~~~~~~~~~~~~~~~~~

For Hubs on which ``JUPYTER_BOKEH_EXTERNAL_URL`` is not set, define a function to
help create the URL for the browser to connect to the Bokeh server.  See below
for a reference implementation. You'll have to either modify this code or
assign the URL of your JupyterHub installation to the environment variable
``EXTERNAL_URL``. JupyterHub defaults to ``JUPYTERHUB_SERVICE_PREFIX`` in this
case.

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

Pass the function you defined above to the |show| function as the
``notebook_url`` keyword argument. Bokeh then calls this function when it sets
up the server and creates the URL to load a graph:

.. code-block:: python

    show(obj, notebook_url=remote_jupyter_proxy_url)

You may need to restart your server after this, and then Bokeh content should load and
execute Python callbacks defined in your Jupyter environment.

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
    :alt: Screenshot of the Jupyter File menu expanded to show the Trust Notebook option.

.. _ug_output_jupyter_notebook_slides:

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

.. _ug_output_jupyter_notebook_notebook_handles:

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
    :alt: Screenshot of Jupyter showing Bokeh push_notebook being imported .

2. Create some plots and pass ``notebook_handle=True`` to |show|:

.. image:: /_images/notebook_comms2.png
    :scale: 50 %
    :align: center
    :alt: Screenshot of Jupyter with Bokeh content created with notebook comms enabled.

3. Check that the handle is associated with the output cell for ``In[2]`` just displayed:

.. image:: /_images/notebook_comms3.png
    :scale: 50 %
    :align: center
    :alt: Screenshot of Jupyter showing the representation of a notebook comms handle in an output cell.

4. Update some properties of the plot, then call |push_notebook| with the handle:

.. image:: /_images/notebook_comms4.png
    :scale: 50 %
    :align: center
    :alt: Screenshot of Jupyter input cell modifying Bokeh properties and calling push_notebook.

5. Note that the output cell for ``In[2]`` has changed (*without* being re-executed):

.. image:: /_images/notebook_comms5.png
    :scale: 50 %
    :align: center
    :alt: Screenshot of Jupyter showing the previous plot updated in place, with glyph color white now.

See the following notebooks for more detailed examples of notebook handle use:

* :bokeh-tree:`examples/output/jupyter/push_notebook/Basic Usage.ipynb`
* :bokeh-tree:`examples/output/jupyter/push_notebook/Continuous Updating.ipynb`
* :bokeh-tree:`examples/output/jupyter/push_notebook/Jupyter Interactors.ipynb`
* :bokeh-tree:`examples/output/jupyter/push_notebook/Numba Image Example.ipynb`

.. _ug_output_jupyter_notebook_jupyter_interactors:

Jupyter interactors
~~~~~~~~~~~~~~~~~~~

You can use notebook widgets, known as `interactors`_, to update
Bokeh plots. The key to doing this is the |push_notebook| function.
The update callback for the interactors calls this function
to update the plot from widget values. See a screenshot of the
:bokeh-tree:`examples/output/jupyter/push_notebook/Jupyter Interactors.ipynb` example
notebook below:

.. image:: /_images/notebook_interactors.png
    :scale: 50 %
    :align: center
    :alt: Screenshot of Jupyter showing a Bokeh plot together with ipywidget sliders.

.. |bokeh.io| replace:: :ref:`bokeh.io <bokeh.io>`

.. |push_notebook| replace:: :func:`~bokeh.io.push_notebook`

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

The main `Bokeh`_ repository also includes some notebook comms examples:

* :bokeh-tree:`examples/output/jupyter/push_notebook/Basic Usage.ipynb`
* :bokeh-tree:`examples/output/jupyter/push_notebook/Continuous Updating.ipynb`
* :bokeh-tree:`examples/output/jupyter/push_notebook/Jupyter Interactors.ipynb`
* :bokeh-tree:`examples/output/jupyter/push_notebook/Numba Image Example.ipynb`

.. _bokeh-notebook: https://github.com/bokeh/bokeh-notebooks
.. _Binder: https://mybinder.org/v2/gh/bokeh/bokeh-notebooks/HEAD?labpath=index.iynb
.. _Bokeh: https://github.com/bokeh/bokeh

.. _ug_output_jupyter_ipywidgets:

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

Follow these steps to build an application with a single Jupyter slider that
logs its adjustments to the console:

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
is the name of the application (see :ref:`ug_server` for details).
This application is available at http://localhost:5006/ipy_slider.

You can build on the above to create more complex layouts and include advanced widgets,
such as `ipyleaflet`_ and `ipyvolume`_. For more examples, see :bokeh-tree:`examples/output/jupyter/ipywidgets`
in the Bokeh repository.

.. _IPyWidgets: https://ipywidgets.readthedocs.io
.. _ipywidgets_bokeh: https://github.com/bokeh/ipywidgets_bokeh
.. _ipyleaflet: https://jupyter.org/widgets#ipyleaflet
.. _ipyvolume: https://jupyter.org/widgets#ipyvolume
