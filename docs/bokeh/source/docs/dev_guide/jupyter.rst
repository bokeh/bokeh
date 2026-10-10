.. _contributor_guide_jupyter:

Jupyter integration
===================

The first-party Jupyter renderer is maintained in the main Bokeh repository.
Its handwritten TypeScript sources live in
``src/bokeh/jupyter/frontend/``. The production JupyterLab and Notebook 7
extension is generated into the parent ``src/bokeh/jupyter/`` package and
shipped in the wheel. Do not edit generated bundles by hand.

Build and test
--------------

Use the Bokeh development environment and run:

.. code-block:: sh

    pixi run --locked jupyter-build
    pixi run --locked --environment notebook-test notebook-browser-install
    pixi run --locked --environment notebook-test test-notebook

The build checks the shared protocol manifest, runs the TypeScript source
tests, type-checks the frontend, builds the AnyWidget adapter and prebuilt
JupyterLab extension, and copies the generated assets into the Python package.
The extension is also consumed by Notebook 7, but automated browser coverage
currently exercises it through JupyterLab. Generated assets must be rebuilt
whenever ``src/bokeh/jupyter/frontend/src`` or the protocol changes. Run
``pixi run --locked jupyter-verify`` to rebuild and confirm that every tracked
generated asset is current.

For a local JupyterLab development session, run the following once from the
repository root so Jupyter can register the Python package that owns the
extension:

.. code-block:: sh

    jupyter labextension develop --overwrite .

The locked ``notebook-test`` environment contains the optional notebook hosts
and proxy used by the browser suite. Its test task verifies extension discovery
and packaging when run against an installed wheel, then runs the AnyWidget,
JupyterLab, and marimo integration suites. Portable Classic Notebook fallback
behavior is covered by Python/JavaScript contract tests; no Classic Bokeh
extension is installed or enabled.

Protocol and lifecycle
----------------------

``src/bokeh/jupyter/protocol.json`` is the shared source of stable MIME names,
comm targets, queue bounds, and the integer protocol version. Python imports
it directly, and the TypeScript behavior check verifies the frontend constants
against it. Change the manifest first and update both consumers together.
JupyterLab and Notebook 7 displays advertise the Bokeh display MIME type and
an HTML fallback. Colab and marimo displays additionally use AnyWidget because
those runtimes are identifiable without inferring a Jupyter frontend from its
kernel. A document's initial serialized graph lives once in an inert HTML data
owner. The same HTML contains one executable copy of each transitive portable
resource record, while the display MIME payload contains resource metadata, so
saved output remains complete when an earlier cell is replaced or deleted.
The live kernel resource comm is a recovery and
deduplication path, never the sole durable owner.

Application outputs persist only their random application ID. Kernel-local
URLs and random server prefixes are returned over the live comm and rewritten
for the current browser at connection time; they must not be saved in notebook
JSON.

Likewise, a timed-out external core script must remain a terminal global load
barrier: removing a dynamic ``script`` element does not guarantee that the
browser will not execute it later. Only a definitive load error may release a
same-version waiter to try another resource representation. Recovery requires
a page reload, which destroys the browser realm; restarting only the kernel
must not clear this barrier.
The portable owner coordinates through DOM markers and delegates resolved
requirements to BokehJS's common ``resource_loader``. Do not add a notebook
resource registry, loader program, promise cache, or document registry on
``window``. Renderers acquire the target-local ``BokehMount`` with
``when_mounted()``, publish failures that occur before a handle exists with
``publish_mount_error()``, and use its read-only ``view_lookup`` when a
non-root view is required.
Keep protocol validation and ``notebook_info()`` fields synchronized.

Normal rendering never captures or persists a PNG. During a UI-initiated HTML
export, the frontend serializes current document or application state to the
server's one-shot transient store. The nbconvert preprocessor renders that
state and captures the complete output container as one bounded PNG. CLI and
offline export reconstruct saved document state instead. Capture failures are
non-fatal and export processing must never change normal cell output or the
saved notebook.

Every renderer view must own an explicit cleanup callback. Static cleanup
removes only its ``ViewManager``. A connected document view closes only its
frontend comm; the Python handle remains available to other and later views.
Application cleanup closes only the BokehJS client session created for that
output. The Python application-view handle can close that session from another
cell without stopping the application. Never infer ownership from the global
Bokeh root index.

Notebook applications use ``BokehASGI`` through Uvicorn. Keep origin checks,
signed session tokens, random URL prefixes, orderly lifespan shutdown, and
per-cell replacement covered by tests. Do not introduce a Tornado ``Server``
fallback into this path.

Version synchronization
-----------------------

The extension version in ``src/bokeh/jupyter/frontend/package.json`` must
match the Python/BokehJS development version. The MIME name remains stable;
compatibility is negotiated with ``protocol_version`` so an older renderer can
display a useful diagnostic.

The saved-file MIME payload contains only a notebook-relative path. The bundled
renderer resolves it with Jupyter's contents manager and creates the link node
itself so JupyterLab's generic HTML link handler cannot redirect the click into
the workspace document viewer. Keep the plain HTML representation as a
portable fallback, and never put kernel filesystem paths or server credentials
in the payload.

Colab currently injects a Bokeh import hook that calls the removed
``install_notebook_hook()`` API. ``bokeh.io.notebook`` recognizes Colab's hook
module and returns a no-op only for that attribute lookup. Keep this adapter
isolated from the public API: it must not restore a hook registry or route any
display through the pre-4.0 callbacks. Colab also isolates output frames, so
automatic static output embeds its portable resource loader directly when
AnyWidget is unavailable. Connected output requires AnyWidget and uses the
same per-frontend ``DocumentViewHandle`` snapshot and patch channel as other
widget hosts.
