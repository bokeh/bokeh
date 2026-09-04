.. _ug_output_jupyter:

Jupyter
=======

.. _ug_output_jupyter_notebook:

Working in notebooks
--------------------

`Jupyter`_ notebooks are computable documents often used for exploratory work,
data analysis, teaching, and demonstration. A notebook is a series of *input
cells* that can execute individually to immediately display their output.
Bokeh supports the current JupyterLab and Notebook 7 frontends and can embed
both standalone and Bokeh server content in either.

.. _Jupyter:  https://jupyter.org

.. _ug_output_jupyter_notebook_inline_plots:

Standalone output
~~~~~~~~~~~~~~~~~

Standalone Bokeh content doesn't require a Bokeh server. Bokeh detects an
interactive kernel, so no output initialization call is needed:

.. code-block:: python

    from bokeh.plotting import figure, show

    p = figure()
    p.line([1, 2, 3], [2, 3, 1])
    p  # static MIME snapshot

Use ``handle = show(p)`` when later Python changes should update the displayed
plot. Explicit ``show()`` calls in a notebook are always connected and return a
handle; no ``live=`` option is needed. The handle is not printed as a second
output when ``show(p)`` is the cell's final statement.

The Bokeh wheel contains an auto-starting renderer for JupyterLab and Notebook
7. Every output carries the same versioned :class:`~bokeh.embed.EmbedArtifact`
used by standalone HTML and framework integrations. The host renderer resolves
the artifact's explicit resource requirements and mounts it through the common
``Bokeh.mount()`` / ``BokehMount`` lifecycle. No separately installed
``jupyter_bokeh`` package is required.

.. image:: /_images/jupyter_artifact_host.png
    :width: 90%
    :align: center
    :alt: JupyterLab displaying a static final-expression plot and a connected Bokeh show output.

Install the ``notebook`` extra to use Bokeh's AnyWidget transport for connected
views across JupyterLab, Notebook, VS Code, Colab, and marimo:

.. code-block:: sh

    pip install "bokeh[notebook]"

AnyWidget carries revisioned live patches, fresh artifact snapshots, resource
requests, and application-view lifecycle messages. The artifact MIME record is
the durable representation for saved Jupyter notebooks, static previews, and
HTML/PNG export. AnyWidget bounds queued patches to 64 messages and 8 MiB; on
overflow or a revision gap it discards the queue and requests a fresh snapshot.
The same bound remains in force while a frontend is processing updates, so a
slow remount cannot grow an unbounded promise chain.
The browser caches each shared resource ID, so ``INLINE`` resources execute
once per frontend rather than being copied into every displayed widget.

The former ``output_notebook()`` initialization function and extensible
notebook-hook registry were removed in Bokeh 4.0. Pass ``resources=`` to an
individual ``show()`` call when the default resource mode is not appropriate.
``show()`` only displays inline when called from a notebook; it does not also
write or open a file unless an explicit ``filename=`` is supplied.

To save a standalone HTML document, call ``save()`` as the cell's final
expression:

.. code-block:: python

    from bokeh.io import save
    from bokeh.resources import CDN

    filename = "plot.html"  # a path served by this notebook's Jupyter server
    save(p, filename=filename, resources=CDN, title="Bokeh plot")
    # The final value renders as an "Open plot.html" link.

Use ``INLINE`` instead of ``CDN`` when the saved file must work without network
access. Keep the file under the Jupyter server root so the browser can reach it.
The return value remains a normal string path for scripts and assignments. Its
rich representation supplies a link only for paths that are relative to the
notebook and contain no parent traversal. The bundled renderer resolves that
path through Jupyter's contents service and creates a native
``target="_blank"`` browser link. Absolute, parent-relative, and platform-
ambiguous paths receive only a generic plain-text saved message, so kernel
filesystem paths cannot leak into notebook HTML or file MIME. This also works
when the kernel is remote, whereas Python's ``webbrowser`` module would try to
open a browser on the kernel host.

Host capabilities
'''''''''''''''''

.. list-table::
    :header-rows: 1

    * - Host
      - Bundled MIME renderer
      - Executable fallback
      - Connected ``show(...)``
      - Local ``show(app)``
    * - JupyterLab 4
      - Auto-starting; browser-tested
      - Contract-tested
      - Browser-tested; AnyWidget or bundled comm
      - Browser-tested
    * - Notebook 7
      - Auto-starting; shares the JupyterLab renderer
      - Contract-tested
      - Contract-tested; AnyWidget or bundled comm
      - Browser reachability applies
    * - Classic Notebook 6
      - None required
      - Contract-tested for trusted output
      - AnyWidget when the notebook extra is installed
      - Unverified; browser reachability applies
    * - VS Code notebooks
      - No first-party VS Code renderer
      - Contract-tested; host execution policy applies
      - AnyWidget when the notebook extra is installed
      - Unverified; webview origin and reachability apply
    * - Colab
      - No extension installation
      - Contract-tested; host smoke test pending
      - AnyWidget contract-tested; host smoke test pending
      - Browser-reachable proxy required
    * - marimo 0.24
      - Native AnyWidget host
      - Not used
      - Browser-tested
      - Browser reachability applies

Here, *contract-tested* means the exact production adapter is tested without
claiming automation inside a proprietary host. A trusted HTML viewer can run
the artifact's common mount bootstrap after loading its resource owner; a
viewer that refuses notebook scripts displays the inert fallback notice. The
bundled renderer keeps current model state only in frontend memory so a
UI-initiated export can use it; it does not add a PNG or export state to normal
cell output.

Colab places cell outputs in isolated browser frames. A static final expression
therefore emits one common artifact fragment whose explicit resource policy is
resolved inside that frame; it does not depend on a separate loader output or a
hidden page-global document registry. Connected ``show(plot)`` and
``show(app)`` require AnyWidget 0.11 or later, which owns resource requests,
synchronization, and disposal inside each view. CDN is the practical default in
Colab; selecting ``INLINE`` repeats BokehJS across isolated output frames
because those frames cannot share loaded JavaScript. These production routes
are contract-tested, but an automated Colab-host smoke test remains pending.

Classic Notebook 6 does not load Bokeh's bundled Jupyter extension. Trusted
notebooks can render the common artifact HTML when its shared resource owner is
present; untrusted saved JavaScript remains subject to Classic Notebook's
normal trust policy. Classic Notebook is a compatibility route rather than the
primary 4.0 host, and versions before Notebook 6 are not supported.

marimo
''''''

marimo is a native AnyWidget host, so both ``show(plot)`` and automatic final
expressions use Bokeh's AnyWidget adapter. The adapter also accounts for
marimo's shadow-DOM output isolation when BokehJS resolves document roots.
Until marimo's built-in Bokeh formatter is updated for Bokeh 4.0, put this
temporary compatibility command in the first cell, before importing Bokeh:

.. code-block:: python

    from marimo._output.formatters.formatters import THIRD_PARTY_FACTORIES
    THIRD_PARTY_FACTORIES["bokeh"].register = lambda: None

This disables only marimo's legacy Bokeh formatter; it does not monkeypatch
Bokeh. Remove the command once the marimo formatter delegates Bokeh 4 output
to its rich representation. See the :bokeh-tree:`examples/output/marimo/bokeh_marimo.py`
example for a connected plot, batched Python updates, and a static final
expression.

A development wheel can be installed directly into a marimo environment. Add
AnyWidget explicitly when installing a local wheel, because pip cannot select
an extra from an unnamed wheel path:

.. code-block:: sh

    python -m pip install /path/to/bokeh-4.0.0.dev1-py3-none-any.whl "anywidget>=0.11" marimo

Install Bokeh in both the kernel environment and the Jupyter server environment
when those are different. The Python package belongs in the kernel; the bundled
renderer assets must be discoverable by the Jupyter server.

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

Resource modes
''''''''''''''

Notebook output accepts a :class:`~bokeh.resources.Resources` configuration. Use
``inline`` or ``offline`` for self-contained output, ``cdn`` for versioned
external assets, ``server``/``relative``/``absolute`` for host-served assets,
and ``none`` only when the notebook host already owns every declared
requirement. ``Resources(nonce=...)`` propagates a CSP nonce to emitted
elements; ``external_only=True`` rejects policies or extension assets that
would require inline code instead of silently weakening the host's CSP.
The first output that needs a resolved resource asset owns it, and later
outputs refer to it by a stable identifier. The resource MIME record includes
the exact artifact requirements, selected policy, dependencies, integrity,
cross-origin, nonce, and module metadata. Inline BokehJS is stored once rather
than copied into every plot output. If a later output introduces tables,
MathJax, or a custom model, only the new assets are added.

.. code-block:: python

    from bokeh.resources import CDN, INLINE, Resources

    show(p, resources=INLINE)
    show(p, resources=CDN)
    show(p, resources=Resources(mode="offline"))
    show(p, resources=Resources(mode="none"))  # host already loaded every requirement
    # Schematic: this URL must actually serve Bokeh's ``static/`` directory.
    show(p, resources=Resources(mode="server", root_url="https://assets.example.test/bokeh/"))

The bundled renderer scans resource records independently of whether their
cells are visible. A consumer can wait for a resource record that appears later
in notebook order. If the owning output was deleted, the bundled renderer
requests the record from the live kernel without adding a second copy to the
notebook. The executable fallback has no kernel recovery channel: if its owner
was deleted, restart the kernel and run the notebook again so that resource
ownership is rebuilt.

If an external script times out, reload the notebook page before retrying or
changing resource modes. A kernel restart alone is insufficient because the
browser page may still execute a timed-out script after its element is removed.
Bokeh therefore keeps that load as a terminal barrier instead of risking two
BokehJS runtimes. A definitive network error does not have this restriction;
you can correct the URL or switch to ``INLINE`` and re-run.

.. image:: /_images/ridgeplot_jupyter_lab.png
    :scale: 25 %
    :align: center
    :alt: Screenshot of Jupyterlab with a Bokeh ridgeplot displayed inline.

Bokeh server applications
~~~~~~~~~~~~~~~~~~~~~~~~~

You can also embed full ASGI Bokeh applications connecting plot events
and Bokeh's built-in widgets directly to Python callback code. Start a managed
application in one cell and display it from one or more later cells:

.. code-block:: python

    from bokeh.io import serve, show
    from bokeh.plotting import figure

    def modify_document(doc):
        p = figure(title="Notebook application")
        p.line([1, 2, 3], [2, 3, 1])
        doc.add_root(p)

    app = serve(modify_document)

``serve()`` also accepts an existing ``Application``, an imported Python
module, a ``.py`` or ``.ipynb`` path, or a directory-style Bokeh application.

.. code-block:: python

    view = show(app)

Each ``show(app)`` creates an independent browser session. Clearing an output
or calling ``view.close()`` closes only that view; neither stops the application
nor affects any other displayed session. Call ``app.stop()`` when the
application is no longer needed. See :ref:`ug_server` for general information
about Bokeh server applications.

The one-step ``show(modify_document)`` API was removed in Bokeh 4.0. This
separation prevents a cell output from implicitly owning and leaking a server.
Configure any explicit proxy override and ASGI server options on ``serve()``,
not ``show(app)``.

The browser must be able to reach the local application server. This is
browser-tested in local JupyterLab; Notebook 7 consumes the same renderer, but
does not currently have a separate automated browser run. In remote JupyterLab
and Notebook 7 sessions, the bundled frontend discovers the Jupyter server's
public base URL and routes kernel-local applications through
``jupyter-server-proxy`` automatically. Other hosts, including VS Code and
Colab, may need an explicit ``notebook_url`` because their portable widget
interface does not expose a standard local-port resolver. The bundled renderer
displays a specific connectivity diagnostic when a required proxy is missing.

When a host does not provide a stable cell ID, automatic replacement is not
possible. Use ``serve(..., key="my-app")`` to make re-execution stop and replace
the earlier managed application. A fixed ``port=`` is safe to reuse with the
same key.

Notebook execution order
''''''''''''''''''''''''

Notebook cells can be executed in any order, but Python object identity still
applies. There are three distinct synchronization models:

* Leaving a Bokeh object as the final expression of a cell automatically
  displays a static MIME snapshot. Use IPython's ``display(p)`` for an explicit
  static display. Later Python mutations do not change either snapshot.
* ``handle = show(p)`` creates a connected artifact view. Property,
  streaming, and patching changes on attached Python models are sent
  automatically. Each browser frontend has an independent connection. Merely
  virtualizing a renderer does not release its output, but deleting a cell,
  replacing its output, or closing the notebook sends an explicit release for
  that view. A frontend opened later receives a current artifact snapshot.
  If an update introduces a newly required built-in bundle or custom
  extension, that snapshot first publishes and identifies the corresponding
  resource record; the frontend loads it before remounting the artifact.
  Use ``handle.views`` for diagnostics and ``handle.close()`` when finished.
  To send several
  changes as one update, use the handle as a batching context:

  .. code-block:: python

      with handle:
          p.title.text = "Updated"
          source.stream(new_data)
* ``app = serve(...)`` followed by ``view = show(app)`` creates a full ASGI
  server-session document. Each call creates an independent view. Closing
  ``view`` closes that view's frontend session without stopping ``app``;
  ``app.stop()`` closes all its views. Arbitrary variables in other notebook
  cells are not automatically models in that session.

Live standalone output requires a supported comm channel. With the notebook
extra installed, AnyWidget provides that channel in JupyterLab, Notebook,
VS Code, Colab, and marimo. Without it, JupyterLab and Notebook use Bokeh's
bundled comm implementation. Colab rejects connected output without AnyWidget
with an actionable install message. A host with neither transport degrades to
the saved static snapshot with a visible "not connected to Python" notice; no
path silently pretends that synchronization is active.

For example, re-executing ``hover = HoverTool()`` creates a new, unattached
object. It cannot replace the old tool already stored in ``p``. Re-executing
``p.add_tools(hover)`` is not a repair: it adds another tool and is not
idempotent. Rebuild the plot in one construction function, or explicitly
select and update the attached tool. Bokeh does not infer Python name intent or
replay cell dependencies.

Target-local browser access
'''''''''''''''''''''''''''

Code outside a cell output, such as a JupyterLab plugin or a custom notebook
host, acquires the same lifecycle handle from that output's root element. It
must not search a page-global view or document registry:

.. code-block:: javascript

    const target = output.querySelector("[data-bokeh-root]")
    const mounted = await Bokeh.when_mounted(target)
    await mounted.ready

    const source = mounted.document.get_model_by_name("my-source")
    const source_view = source == null ? null : mounted.view_lookup.find_one(source)

    // Dispose only when this host owns the output.
    await mounted.dispose()

The target's ``bokehMount`` property is the same handle returned by
``when_mounted()``. It owns readiness, failures, document access, view lookup,
and disposal for that one output. Replacing or deleting the output disposes
the handle; consumers should acquire the replacement target instead of
retaining models or views from an earlier display.

Diagnostics
'''''''''''

Failures render an accessible panel with a stable code, recovery action, and a
redacted copyable report. Artifact graphs, inline JavaScript, URL credentials,
query strings, and private application paths are never copied into the bundled
renderer's report. If
clipboard access is blocked, **Copy report** selects the report and gives
instructions for copying it manually. Because the fallback has no kernel
recovery channel, it may direct the user to restart and run the notebook again.
Application diagnostics in hosts without the bundled renderer remain
host-dependent.

Run ``bokeh.io.notebook_info()`` to include the Bokeh and Python versions,
Python executable, Bokeh package path, protocol and MIME names,
packaged-renderer availability, comm availability, shared-resource record count, and
managed-application count in a bug report. As a cell's final expression it
renders a compact branded summary with expandable technical details; assigning
it to a name still gives a normal dictionary-like value for programmatic
inspection. Renderer negotiation is per output; there is no page-global
renderer-status handshake. A packaged extension and a connected kernel remain
separate checks when the kernel and Jupyter server use different environments.
The information does not include artifact graphs, resource source, or private
application URLs.

Static HTML export
''''''''''''''''''

For trusted Bokeh output, the Jupyter server extension generates one PNG around
the complete rendered output container when JupyterLab or Jupyter Notebook
exports the notebook to HTML. Multiple document roots, layouts, widgets,
toolbars, canvas and WebGL plots, and Bokeh DOM content are rendered together
in a real browser before that container is captured.

An export started from an open notebook uses a one-shot serialization of the
current BokehJS document. This includes frontend widget and tool state and also
allows current connected documents and notebook applications to become a
static PNG. A cryptographically random correlation ID binds the frontend POST,
notebook path, and authenticated nbconvert GET, so concurrent exports of the
same notebook cannot consume one another's snapshots. The serialization is
held briefly in bounded server memory and consumed exactly once by that export;
it is never inserted into the notebook model. If no frontend state
is available, as in a command-line or offline export, the exporter reconstructs
the saved MIME snapshot instead. This also works for saved connected plot
output. A notebook application has no saved server document, so it receives a
specific unavailable message unless an open frontend supplies current state.

The explicit command-line exporter is
``jupyter nbconvert --to bokeh notebook.ipynb``. Both UI and command-line
paths operate on nbconvert's private notebook copy. Running, saving, and
exporting never captures a PNG into the live cell output or adds a second
visible representation to the interactive notebook. Bokeh's export processing
does not write either the transient state or PNG back to the saved notebook.

Export-time PNG capture requires Playwright and its Chromium browser.
Empty output, models that cannot be reconstructed, capture failures, and PNGs
larger than 10 MiB cannot carry a PNG. Their static HTML explains which stage
failed and, where applicable, how to produce an exportable snapshot. Untrusted
notebooks are never executed for PNG capture; trust and save the notebook
before exporting. The interactive custom-MIME output remains the primary
notebook display.

.. list-table::
    :header-rows: 1

    * - Code
      - Meaning and recovery
    * - ``PAYLOAD_INVALID`` / ``PROTOCOL_VERSION_MISMATCH``
      - Saved output and renderer disagree; update Bokeh, restart, and reload.
    * - ``RESOURCE_RECORD_MISSING``
      - Neither notebook nor live kernel has the owner; re-run the display in the bundled renderer, or restart for the fallback.
    * - ``RESOURCE_SOURCE_MISSING`` / ``RESOURCE_LOAD_FAILED``
      - Resource data or URL failed; check network access or use ``INLINE``. After a timeout, reload the notebook page before retrying or changing modes; a kernel restart alone does not clear the browser-side barrier.
    * - ``BOKEH_VERSION_MISMATCH``
      - Python and BokehJS differ; restart the kernel and reload the page.
    * - ``ARTIFACT_RECORD_MISSING`` / ``ARTIFACT_RECORD_INVALID``
      - The versioned artifact is absent, malformed, or disagrees with its MIME fingerprint; re-run the display cell and save it again.
    * - ``ARTIFACT_RENDER_FAILED``
      - The artifact was available but its common ``BokehMount`` lifecycle could not become ready.
    * - ``FILE_PATH_UNAVAILABLE`` / ``FILE_LINK_FAILED``
      - Jupyter could not serve the saved path; save it under the notebook directory and evaluate ``save(...)`` again.
    * - ``LIVE_SYNC_UNAVAILABLE``
      - This host cannot open Bokeh's per-view comm; the renderer uses the saved snapshot and marks it as disconnected.
    * - ``LIVE_SYNC_SETUP_FAILED`` / ``LIVE_DOCUMENT_CONNECTION_TIMEOUT`` / ``LIVE_DOCUMENT_UNAVAILABLE``
      - The frontend could not attach to the connected document; the renderer uses the saved snapshot when possible. Check the kernel connection and re-run ``show(...)``.
    * - ``LIVE_DOCUMENT_NOT_FOUND`` / ``LIVE_DOCUMENT_CLOSED``
      - The kernel no longer owns the document handle. Re-run ``show(...)`` to create a new connected view.
    * - ``ANYWIDGET_RESOURCE_REQUEST_FAILED`` / ``ANYWIDGET_RESOURCE_REQUEST_TIMEOUT``
      - The AnyWidget mounted but could not fetch its BokehJS resource record from Python. Check the kernel, then re-run the display cell.
    * - ``ANYWIDGET_LIVE_CONNECTION_TIMEOUT`` / ``ANYWIDGET_APPLICATION_CONNECTION_TIMEOUT``
      - The AnyWidget mounted but Python did not open its connected document or application-view channel. Check the kernel and ASGI application, then re-run ``show(...)``.
    * - ``APPLICATION_RENDER_FAILED``
      - The server artifact could not negotiate or mount its application session.
    * - ``APPLICATION_VIEW_CONNECTION_TIMEOUT`` / ``APPLICATION_VIEW_UNAVAILABLE``
      - The frontend could not establish the per-view application control channel. Check the kernel connection and re-run ``show(app)``.
    * - ``APPLICATION_VIEW_NOT_FOUND`` / ``APPLICATION_VIEW_CLOSED``
      - The kernel no longer owns that application view handle. Re-run ``show(app)`` to create a new view.
    * - ``UNEXPECTED_RENDER_ERROR``
      - The renderer encountered an unclassified failure; copy the redacted report and check the browser console and kernel output.

JupyterHub
''''''''''

When running notebooks from your own JupyterHub instance, some additional
steps are necessary to embed Bokeh server applications and to enable network
connectivity between the client browser and the Bokeh server running in a
JupyterLab cell. This is because your browser needs to connect to the port the
Bokeh server is listening on. However, JupyterHub is acting as a reverse proxy
between your browser and your JupyterLab container.

The Bokeh Jupyter frontend reads the server's public base URL from Jupyter and
maps each kernel-local application port through ``jupyter-server-proxy``. A
normal JupyterLab or Notebook 7 notebook therefore uses ``serve(application)``
unchanged in local and JupyterHub sessions.

Required Dependencies
~~~~~~~~~~~~~~~~~~~~~

Follow all the JupyterLab (not JupyterHub) instructions above, then continue by
installing the ``jupyter-server-proxy`` package and enabling its server extension:

.. code:: sh

    pip install jupyter-server-proxy && jupyter server extension enable --py jupyter-server-proxy

Fallback proxy configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Notebook hosts that do not expose Jupyter's frontend configuration can still
provide the external URL in the kernel environment:

.. code:: sh

   export JUPYTER_BOKEH_EXTERNAL_URL="https://our-hub.science.edu"

Often this is done in JupyterHub Helm chart configuration YAML like this:

.. code-block:: yaml

   singleuser:
     extraEnv:
       JUPYTER_BOKEH_EXTERNAL_URL: "https://our-public-hub-name.edu"

For a nonstandard proxy, define a function that maps the private application
port to its browser-reachable URL. You will have to modify this example for the
host's routing scheme or assign its public URL to ``EXTERNAL_URL``:

.. code-block:: python

    import os
    import urllib.parse

    def remote_jupyter_proxy_url(port):
        """
        Callable to configure Bokeh's serve method when a proxy must be
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

Pass the function to :func:`~bokeh.io.serve` as the ``notebook_url`` override:

.. code-block:: python

    app = serve(modify_document, notebook_url=remote_jupyter_proxy_url)
    show(app)

This override also supplies the WebSocket origin allowed by the application.

Trusting notebooks
~~~~~~~~~~~~~~~~~~

Depending on the version of the notebook you are using, you may have to
`trust the notebook <https://jupyter-server.readthedocs.io/en/stable/operators/security.html#explicit-trust>`_
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
Include the resource-owner output in the slideshow export. The bundled renderer
can resolve out-of-order owners, but a static slide export has no kernel from
which to recover a deleted owner.

.. _ug_output_jupyter_notebook_notebook_handles:

Connected handles and batching
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Call |show| to update a displayed plot without reloading it:

.. code-block:: python

    handle = show(p)
    p.title.text = "Updated"  # synchronized immediately

The returned handle controls the lifetime and batching of that connected output.
Ordinary changes are sent immediately. Use the handle as a context manager to
send one protocol update when the outermost context exits:

.. code-block:: python

    with handle:
        p.title.text = "New samples"
        source.stream(new_data)
        p.background_fill_color = "whitesmoke"

Nested handle contexts are supported. Changes are still sent if the context body
raises, because the Python models have already changed. Call ``handle.close()``
when the output should stop observing its source document.

Connected handles use the first-party extension's kernel comm bridge in JupyterLab
and Notebook 7. Other hosts may only support the portable static output
fallback.

.. _ug_output_jupyter_notebook_jupyter_interactors:

Jupyter interactors
~~~~~~~~~~~~~~~~~~~

You can use notebook widgets, known as `interactors`_, to update
Bokeh plots. Display the plot with ``show(p)`` and mutate its models in the
interactor callback. The returned handle synchronizes those changes automatically.
See a screenshot of the
:bokeh-tree:`examples/output/jupyter/live/Jupyter Interactors.ipynb` example
notebook below:

.. image:: /_images/notebook_interactors.png
    :scale: 50 %
    :align: center
    :alt: Screenshot of Jupyter showing a Bokeh plot together with ipywidget sliders.

.. |bokeh.io| replace:: :ref:`bokeh.io <bokeh.io>`

.. _interactors: http://ipywidgets.readthedocs.io/en/latest/examples/Using%20Interact.html
.. _Reveal.js: http://lab.hakim.se/reveal-js/#/

More example notebooks
~~~~~~~~~~~~~~~~~~~~~~

Core-review walkthrough
''''''''''''''''''''''''

Three short runs expose the important user-facing differences in the 4.0
notebook host. They intentionally use normal notebook APIs rather than testing
private renderer hooks:

* **Portable saved output:** run
  :bokeh-tree:`examples/output/jupyter/automatic_mime.ipynb`, save the notebook,
  restart the kernel, and reopen it. The final-expression plot remains a static
  artifact snapshot with an inert fallback for hosts that do not execute its
  renderer.
* **Connected output and release:** run
  :bokeh-tree:`examples/output/jupyter/live/Basic Usage.ipynb`, mutate the data
  from Python, and observe the existing output update. Reload the browser to
  exercise snapshot-plus-revision reconnection; clear the output or call
  ``handle.close()`` to demonstrate that only that view is released.
* **Static export:** with either notebook open, use the Jupyter **Export to
  HTML** command or run ``jupyter nbconvert --to bokeh notebook.ipynb``. The
  exported page contains a browser-captured PNG of the complete current output,
  while the saved notebook remains unchanged.

Together these cover the three deliberately separate responsibilities: an
``EmbedArtifact`` persists initial state, the notebook host owns live transport
and release, and export consumes a one-shot frontend snapshot without creating
a second runtime or document registry.

You can find many more examples of notebook use in the `bokeh-tutorial`_ repository:

1. Clone the repository locally:

   .. code:: sh

    git clone https://github.com/bokeh/tutorial.git

2. Launch the Jupyter notebooks in your web browser.

The main `Bokeh`_ repository also includes live notebook examples:

* :bokeh-tree:`examples/output/jupyter/live/Basic Usage.ipynb`
* :bokeh-tree:`examples/output/jupyter/live/Continuous Updating.ipynb`
* :bokeh-tree:`examples/output/jupyter/live/Jupyter Interactors.ipynb`
* :bokeh-tree:`examples/output/jupyter/live/Numba Image Example.ipynb`

.. _bokeh-tutorial: https://github.com/bokeh/tutorial/
.. _Bokeh: https://github.com/bokeh/bokeh

.. _ug_output_jupyter_ipywidgets:

IPyWidgets outside the notebook
-------------------------------

Now that you know how to use Bokeh in JupyterLab and Notebook 7,
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
This application is available at ``http://localhost:5006/ipy_slider``.

You can build on the above to create more complex layouts and include advanced widgets,
such as `ipyleaflet`_ and `ipyvolume`_. For more examples, see :bokeh-tree:`examples/output/jupyter/ipywidgets`
in the Bokeh repository.

.. _IPyWidgets: https://ipywidgets.readthedocs.io
.. _ipywidgets_bokeh: https://github.com/bokeh/ipywidgets_bokeh
.. _ipyleaflet: https://jupyter.org/widgets#ipyleaflet
.. _ipyvolume: https://jupyter.org/widgets#ipyvolume
