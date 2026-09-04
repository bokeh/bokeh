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

    cd src/bokeh/jupyter/frontend
    npm ci
    npm run build
    npm run build:runtime-test
    cd ../../../..
    pytest tests/unit/bokeh/io/test_jupyter.py
    pytest tests/unit/bokeh/io/test_jupyter_runtime.py
    pytest tests/integration/test_jupyter_extension.py

The build performs TypeScript checking, builds the prebuilt JupyterLab
extension used by both JupyterLab and Notebook 7, and copies installation
metadata. ``build:runtime-test`` creates a non-shipped browser harness for the
shared renderer runtime tests. Generated assets must be rebuilt whenever
``src/bokeh/jupyter/frontend/src`` or the protocol changes. A release check
should build a wheel, install it into a clean environment, verify
``jupyter labextension list``, and run the wheel-installed browser tests.

The CI ``jupyter-classic`` job creates an isolated Notebook 6.5.7 environment
and runs the Classic frontend smoke test. That test must render both an
automatic snapshot and ``show()`` output through their standard ``text/html``
and ``application/javascript`` fallback outputs; no Classic Bokeh extension
may be installed or enabled.

Protocol and lifecycle
----------------------

``bokeh.io.jupyter`` and ``src/bokeh/jupyter/frontend/src/protocol.ts`` define
the same stable MIME names and integer protocol version. Change them together.
Resource output owns JS/CSS artifacts once; document and application outputs
refer to resource manifests. A document's initial serialized graph lives once in an inert HTML
data owner; both its MIME payload and executable fallback refer to that owner
by ID so large data sources are not duplicated in the saved notebook. In the
bundled renderer, consumers may render before owners and the
resource comm target can recover a deleted owner from a live kernel. The
executable fallback has no kernel channel and must not promise that recovery.
Likewise, a timed-out external core script must remain a terminal global load
barrier: removing a dynamic ``script`` element does not guarantee that the
browser will not execute it later. Only a definitive load error may release a
same-version waiter to try another resource representation. Recovery requires
a page reload, which destroys the browser realm; restarting only the kernel
must not clear this barrier.
The bundled frontends also announce themselves over this comm target after
processing a resource output; keep that bounded handshake and
``notebook_info()`` fields synchronized.

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
display through the pre-4.0 callbacks. Colab also isolates output frames and
may separate a MIME bundle's HTML and JavaScript representations, so a portable
document must carry both its transitive resource loaders and a serialized
document backup in its JavaScript representation. Keep this duplication
Colab-only; normal hosts must continue to store each document graph and execute
each shared resource record once. Colab's browser API registers targets for
kernel-initiated comms, the reverse of JupyterLab's connection direction. The
portable document therefore registers a unique target before Python opens the
comm and then feeds its snapshot and patch chunks through the same
``DocumentViewHandle`` and BokehJS patch receiver used by the bundled renderer.
