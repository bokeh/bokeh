.. _ug_output_jupyter:

Jupyter
=======

.. _ug_output_jupyter_notebook:

Working in notebooks
--------------------

`Jupyter`_ notebooks combine executable code, explanatory text, and rich
output. Bokeh supports JupyterLab 4 and Notebook 7 without a separate
``jupyter_bokeh`` installation. It can display standalone plots, synchronize
plots with Python, and run Bokeh applications with Python callbacks.

No initialization call is needed. The ``output_notebook()`` function was
removed in Bokeh 4.0.

.. _Jupyter: https://jupyter.org

Installation
~~~~~~~~~~~~

Installing Bokeh also installs its JupyterLab and Notebook 7 integration:

.. code-block:: sh

    pip install bokeh

Install the ``notebook`` extra to use connected output in Colab or marimo:

.. code-block:: sh

    pip install "bokeh[notebook]"

If the Jupyter server and Python kernel use different environments, install
Bokeh in both. The server environment supplies the notebook extension, while
the kernel environment supplies the Python library and BokehJS resources.
Matching versions are recommended. Compatible versions can differ, but after
updating either environment you should restart the kernel and reload the
notebook page.

.. _ug_output_jupyter_notebook_inline_plots:

Displaying plots
~~~~~~~~~~~~~~~~

Leaving a Bokeh object as the final expression of a cell displays a static
snapshot:

.. code-block:: python

    from bokeh.plotting import figure

    p = figure(title="Static notebook output")
    p.line([1, 2, 3], [2, 3, 1])
    p

Later Python changes do not update this output. Use ``show()`` when the plot
should remain connected to Python:

.. code-block:: python

    from bokeh.io import show

    handle = show(p)
    p.title.text = "Updated from Python"

The change is sent to the existing output automatically. ``show()`` returns a
handle that controls that connected view. When ``show(p)`` is the final
statement in a cell, the handle is not printed as an additional output.

Call ``show()`` more than once in the same cell to display multiple outputs in
order.

.. image:: /_images/jupyter_artifact_host.png
    :width: 90%
    :align: center
    :alt: JupyterLab displaying static and Python-connected Bokeh output.

Supported notebook hosts
''''''''''''''''''''''''

.. list-table::
    :header-rows: 1

    * - Host
      - Static output
      - Python-connected output
      - Notebook applications
    * - JupyterLab 4
      - Yes
      - Yes
      - Yes
    * - Notebook 7
      - Yes
      - Yes
      - Yes
    * - marimo
      - Yes
      - Requires ``bokeh[notebook]``
      - Yes, when the application URL is browser-reachable
    * - Colab
      - Yes
      - Requires ``bokeh[notebook]``
      - Requires ``bokeh[notebook]`` and a browser-reachable proxy
    * - VS Code notebooks
      - Portable static output
      - Not supported by the first-party integration
      - Host-dependent
    * - Classic Notebook 6
      - Portable static output in a trusted notebook
      - Not supported by the first-party integration
      - Host-dependent

When connected output is unavailable, Bokeh displays the saved static plot
with a notice that Python-driven updates are disabled. The plot remains
interactive in the browser, but later Python property changes are not applied.

Selecting resources
''''''''''''''''''''

The default resource setting is appropriate for most notebooks. Use ``INLINE``
for output that must work without network access, or ``CDN`` to load versioned
BokehJS files from the Bokeh CDN:

.. code-block:: python

    from bokeh.resources import CDN, INLINE

    show(p, resources=INLINE)
    show(p, resources=CDN)

You can also pass a :class:`~bokeh.resources.Resources` object for a custom
resource configuration. If a CDN or other external script times out, reload
the notebook page before changing resource modes and trying again. Reloading
ensures that the browser cannot later activate the timed-out script alongside
the replacement.

Colab places outputs in separate browser frames. ``CDN`` is usually the most
efficient choice there. ``INLINE`` works without network access but includes
BokehJS in each frame.

Saving standalone HTML
''''''''''''''''''''''

Use :func:`~bokeh.io.save` to create a standalone HTML file. When its return
value is the final expression of a cell, Bokeh displays a link to the file:

.. code-block:: python

    from bokeh.io import save
    from bokeh.resources import CDN

    saved = save(p, filename="plot.html", resources=CDN, title="Bokeh plot")
    saved

Use ``INLINE`` instead of ``CDN`` when the saved file must work offline. Use a
path relative to the notebook and keep the file somewhere the Jupyter server
can serve. In a split server and kernel setup, that usually requires a shared
working directory. Absolute paths and paths that traverse to a parent directory
are displayed as plain text rather than browser links.

.. _ug_output_jupyter_notebook_notebook_handles:

Connected handles and batching
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Changes to a plot displayed with ``show()`` are normally sent immediately.
Use its handle as a context manager to group several changes into one update:

.. code-block:: python

    handle = show(p)

    with handle:
        p.title.text = "New samples"
        source.stream(new_data)
        p.background_fill_color = "whitesmoke"

Call ``handle.close()`` when that output should stop receiving updates. Other
views of the same plot remain active.

Notebook execution order still follows normal Python object identity. If you
recreate an object in another cell, an earlier plot still contains the original
object. For example, assigning a new ``HoverTool`` to the same Python variable
does not replace the tool already attached to a plot. Rebuild the plot or
select and update the attached model explicitly.

After restarting the kernel, rerun the cell containing ``show()`` to create a
new connected handle. A saved static representation remains visible without a
kernel.

.. _ug_output_jupyter_notebook_jupyter_interactors:

Jupyter interactors
~~~~~~~~~~~~~~~~~~~

Notebook widgets, also known as `interactors`_, can update connected Bokeh
plots. Display the plot with ``show()`` and mutate its models in the widget
callback. The returned handle sends those changes automatically.

See the
:bokeh-tree:`examples/output/jupyter/live/Jupyter Interactors.ipynb` example
for a complete notebook.

.. _interactors: https://ipywidgets.readthedocs.io/en/latest/examples/Using%20Interact.html

Bokeh applications
~~~~~~~~~~~~~~~~~~

Bokeh applications connect plot events and Bokeh widgets directly to Python
callbacks. Start an application in one cell, then display it in another:

.. code-block:: python

    from bokeh.io import serve, show
    from bokeh.plotting import figure

    def modify_document(doc):
        p = figure(title="Notebook application")
        p.line([1, 2, 3], [2, 3, 1])
        doc.add_root(p)

    app = serve(modify_document)

.. code-block:: python

    view = show(app)

Each ``show(app)`` creates an independent browser session. Calling
``view.close()`` or clearing its cell closes only that view. Call
``app.stop()`` when the application is no longer needed.

``serve()`` also accepts an existing ``Application``, an imported Python
module, a ``.py`` or ``.ipynb`` path, a directory-style Bokeh application, or
a callable object. A callable object is shared by every session and is called
on the application's server thread. Treat its attributes as read-only after
calling ``serve()``, and keep per-session state on the document and its models.

The older ``show(modify_document)`` form was removed in Bokeh 4.0. Start the
application explicitly with ``serve()`` before displaying it.

Re-executing a cell normally replaces the application associated with that
cell. If the notebook host does not provide stable cell identifiers, use a key
to request the same behavior explicitly:

.. code-block:: python

    app = serve(modify_document, key="my-app")

The browser must be able to reach the application server. Local JupyterLab and
Notebook 7 handle this automatically. Remote deployments normally route the
connection through ``jupyter-server-proxy``. See the JupyterHub section below
for configuration details.

marimo and Colab
''''''''''''''''

marimo supports Bokeh's connected output through AnyWidget. Install
``bokeh[notebook]`` and use the same ``show()`` and ``serve()`` APIs shown
above. See :bokeh-tree:`examples/output/marimo/bokeh_marimo.py` for a connected
plot, batched updates, and static output.

Colab also requires ``bokeh[notebook]`` for ``show(plot)`` and ``show(app)``.
Static final-expression output works without AnyWidget. Applications require a
proxy whose URL is reachable from the browser.

JupyterHub
''''''''''

JupyterHub places a reverse proxy between the browser and the notebook server.
Install and enable ``jupyter-server-proxy`` so browser connections can reach
applications started in notebook cells:

.. code-block:: sh

    pip install jupyter-server-proxy
    jupyter server extension enable --py jupyter-server-proxy

JupyterLab and Notebook 7 normally discover the public server URL
automatically, so ``serve(modify_document)`` works unchanged in both local and
JupyterHub sessions.

For a host with a nonstandard proxy, set its public URL in the kernel
environment:

.. code-block:: sh

    export JUPYTER_BOKEH_EXTERNAL_URL="https://our-hub.science.edu"

If the proxy needs custom port mapping, pass a callable as ``notebook_url`` to
``serve()``. The callable receives the application port and returns the
browser-reachable URL. It is called with ``None`` when Bokeh needs the public
host name for its WebSocket origin:

.. code-block:: python

    import os
    import urllib.parse

    def remote_jupyter_proxy_url(port):
        base_url = os.environ["EXTERNAL_URL"]
        if port is None:
            return urllib.parse.urlparse(base_url).netloc

        service_path = os.environ["JUPYTERHUB_SERVICE_PREFIX"]
        user_url = urllib.parse.urljoin(base_url, service_path)
        return urllib.parse.urljoin(user_url, f"proxy/{port}")

    app = serve(modify_document, notebook_url=remote_jupyter_proxy_url)
    show(app)

Exporting notebooks
~~~~~~~~~~~~~~~~~~~

Use Jupyter's **Export to HTML** command to export an open notebook. Bokeh
captures the current state of each rendered output as a PNG in the exported
HTML. The saved notebook and its interactive cell output are not changed.

You can also export from the command line:

.. code-block:: sh

    jupyter nbconvert --to bokeh notebook.ipynb

A user-interface export can include current frontend interactions and
connected plots. A command-line export uses the state saved in the notebook.
An application has no saved server document, so export it while the application
is open if its current view should be captured.

PNG capture requires Playwright and its Chromium browser. Trust and save the
notebook before exporting. If a plot cannot be reconstructed or captured, the
exported HTML includes an explanation in place of its PNG.

When executing a notebook from source that you have reviewed and trust, you can
disable the saved-signature requirement for that export:

.. code-block:: sh

    jupyter nbconvert --to bokeh --execute \
        --BokehPNGPreprocessor.require_trusted=False notebook.ipynb

Do not use this option with an untrusted notebook. Executing a notebook runs its
Python code, and converting Bokeh output may also run JavaScript saved in its
cells.

Trusting notebooks
~~~~~~~~~~~~~~~~~~

Saved Bokeh output may contain JavaScript. Jupyter therefore requires a
notebook to be trusted before it restores that output. Use **Trust Notebook**
from Jupyter's **File** menu when output does not reappear after reopening a
notebook.

Diagnostics and troubleshooting
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Evaluate :func:`~bokeh.io.notebook_info` in a cell to display the Bokeh and
Python versions, installation path, renderer availability, and connection
status. Include this summary when reporting a notebook problem.

Common recovery steps are:

.. list-table::
    :header-rows: 1

    * - Symptom
      - Action
    * - The plot is static and reports that Python-connected output is unavailable
      - Use JupyterLab 4 or Notebook 7 with Bokeh installed in the server environment. In Colab or marimo, install ``bokeh[notebook]``.
    * - A connected plot stopped updating after a kernel restart
      - Rerun the cell containing ``show()`` to create a new handle.
    * - Python and BokehJS versions disagree
      - Restart the kernel, reload the notebook page, and rerun the display cells.
    * - CDN resources do not load
      - Check network access or use ``resources=INLINE``. Reload the page after a timeout before retrying.
    * - A notebook application cannot connect
      - Check that the application is still running and that its proxy URL is reachable from the browser.
    * - A saved-file link is unavailable
      - Save the file under the notebook directory and evaluate ``save()`` again.

Diagnostic panels include a **Copy report** action with a redacted technical
summary. The report omits inline JavaScript, model data, URL credentials, and
private application paths.

.. _ug_output_jupyter_notebook_slides:

Notebook slides
~~~~~~~~~~~~~~~

Standalone Bokeh output can be included in Reveal.js slides generated from a
trusted notebook. Make sure the plot's output cell is included in the exported
slides. Connected Python updates and running application sessions are not
available after the slideshow has been exported.

.. _Reveal.js: https://revealjs.com

More example notebooks
~~~~~~~~~~~~~~~~~~~~~~

The Bokeh repository includes these connected notebook examples:

* :bokeh-tree:`examples/output/jupyter/live/Basic Usage.ipynb`
* :bokeh-tree:`examples/output/jupyter/live/Continuous Updating.ipynb`
* :bokeh-tree:`examples/output/jupyter/live/Jupyter Interactors.ipynb`
* :bokeh-tree:`examples/output/jupyter/live/Numba Image Example.ipynb`

Additional introductory notebooks are available in the `bokeh-tutorial`_
repository.

.. _bokeh-tutorial: https://github.com/bokeh/tutorial/

.. _ug_output_jupyter_ipywidgets:

IPyWidgets outside the notebook
-------------------------------

You can use the `ipywidgets_bokeh`_ extension to include IPyWidgets in a Bokeh
server application outside JupyterLab and Notebook 7:

.. code-block:: sh

    conda install -c bokeh ipywidgets_bokeh

or:

.. code-block:: sh

    pip install ipywidgets_bokeh

Wrap the widget in an ``IPyWidget`` model and add it to the Bokeh document.
The following application adds an IPyWidgets slider:

.. code-block:: python

    from ipywidgets import FloatSlider

    angle = FloatSlider(min=0, max=360, value=0, step=1, description="Angle")

    def on_change(change):
        print(f"angle={change['new']} deg")

    angle.observe(on_change, names="value")

.. code-block:: python

    from bokeh.plotting import curdoc
    from ipywidgets_bokeh import IPyWidget

    ipywidget = IPyWidget(widget=angle)
    curdoc().add_root(ipywidget)

Run the application with ``bokeh serve ipy_slider.py``. For additional
examples, see :bokeh-tree:`examples/output/jupyter/ipywidgets`.

.. _ipywidgets_bokeh: https://github.com/bokeh/ipywidgets_bokeh
