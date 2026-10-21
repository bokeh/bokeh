.. _contributor_guide_jupyter:

Jupyter integration
===================

Bokeh provides a first-party notebook integration for JupyterLab and Notebook
7. Other notebook hosts, including Colab and marimo, can use the same rendering
runtime through an AnyWidget adapter. The integration supports standalone
plots, Python-connected documents, Bokeh applications, saved notebook output,
and notebook export.

Source layout
-------------

The integration is split between Python and TypeScript:

* :bokeh-tree:`src/bokeh/io/notebook.py` manages Python display functions and
  connected document handles.
* :bokeh-tree:`src/bokeh/io/jupyter.py` defines the payloads shared with
  notebook frontends.
* :bokeh-tree:`jupyter/src` contains the TypeScript sources for the JupyterLab
  extension and AnyWidget adapter.
* :bokeh-tree:`src/bokeh/jupyter/protocol.json` defines the protocol version,
  MIME types, comm targets, and transport limits shared by Python and
  TypeScript.

The frontend build produces the prebuilt JupyterLab extension and AnyWidget
module under ``src/bokeh/jupyter/``. These generated files are not maintained
by hand. Packaging builds them before creating a source distribution. A wheel
built from that source distribution therefore requires only the standard
Python build toolchain, not Node.js or the TypeScript sources.

Build and test
--------------

From the repository root, build the frontend and run the notebook test suite
with:

.. code-block:: sh

    pixi run --locked jupyter-build
    pixi run --locked --environment notebook-test notebook-browser-install
    pixi run --locked --environment notebook-test test-notebook

``jupyter-build`` checks the shared protocol constants, runs the TypeScript
tests and type checker, and builds both frontend adapters. Rebuild the assets
after changing ``jupyter/src`` or ``protocol.json``.

The build uses portable Pixi tasks for npm installation and compilation,
followed by Python checks for the packaged assets.

The ``notebook-test`` environment includes the supported optional notebook
hosts and the browser dependencies used by the integration tests. The suite
covers Python payload generation, frontend runtime behavior, JupyterLab,
AnyWidget, marimo, packaging, and notebook export.

The repository setup task includes the built extension and
``bokeh-jupyter.json`` server configuration in the editable Python wheel. Pip
therefore owns these discovery files and removes them when Bokeh is
uninstalled. Run ``pixi run reinstall`` after changing the frontend so the
rebuilt files are copied into the Pixi environment.

Rendering model
---------------

Python publishes a versioned display payload together with a serialized Bokeh
artifact and the resource records needed to load BokehJS. The JupyterLab
extension and AnyWidget adapter pass these inputs to the same frontend runtime.
That runtime validates the payload, loads the matching BokehJS resources, and
mounts the artifact through ``BokehMount``.

Notebook output also contains a portable HTML representation. This makes saved
output viewable without a running kernel and keeps it usable in notebook hosts
that do not provide Bokeh's richer MIME renderer. Resource records are stored
with the output so that deleting or replacing an earlier cell does not make
later output incomplete. While a kernel is connected, a resource comm provides
deduplication and recovery for those same records.

A browser page can host only one BokehJS version at a time. If the kernel's
Bokeh version changes, restart the kernel and reload the notebook page before
running cells again.

Connected output
----------------

Connected documents add a comm channel to the static artifact. The Python
``DocumentViewHandle`` sends document patches and binary buffers to each
connected frontend view. Each view can reconnect from a complete snapshot and
then apply later revisions in order.

Frontend views have independent lifecycles. Removing one output closes that
view's comm and BokehJS mount without invalidating other views of the same
document. Closing the Python handle disconnects all of its views. AnyWidget
hosts additionally report frontend activity so Python can release abandoned
widget instances without evicting active outputs.

Notebook applications are served with ``BokehASGI`` and Uvicorn. Saved output
contains an opaque application identifier rather than a kernel-local URL. The
current URL is returned over the live connection and resolved for the browser
that opened the notebook. Each output owns its own BokehJS client session.

Saved files and export
----------------------

Saved-file payloads contain notebook-relative paths. The Jupyter frontend uses
the contents manager to turn those paths into download links relative to the
notebook's location.

Interactive HTML export asks active frontend views for their current document
state. The nbconvert preprocessor renders that state and captures the complete
output container. Command-line or offline export uses the state already saved
in the notebook. Export capture is separate from normal cell rendering and a
capture failure does not alter the displayed output.

Protocol compatibility
----------------------

The local Jupyter extension and remote kernel do not need identical Bokeh
package versions when they implement the same notebook protocol. The remote
kernel supplies the artifact and its matching BokehJS resources. The frontend
rejects an unsupported protocol version with a diagnostic instead of trying to
interpret an incompatible payload.

Within one output, the Python artifact and BokehJS runtime must match exactly.
This check prevents an artifact from being rendered by a different BokehJS
schema. Development versions that are not available from the CDN should use
inline resources.

When changing the protocol, update ``protocol.json`` first and then update the
Python and TypeScript consumers together. Add tests at the boundary affected by
the change, rebuild the frontend, and run the notebook suite before committing
the source changes.
