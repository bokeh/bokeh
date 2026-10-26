.. _ug_server_getting_started:

Getting started
===============

Start with a module app. No web framework is needed.

Create ``main.py``:

.. code-block:: python

    from bokeh.layouts import column
    from bokeh.models import Button, Div
    from bokeh.server.asgi import BokehASGI


    def modify_document(doc):
        result = Div(text="Ready")
        button = Button(label="Compute")

        def compute():
            result.text = "Result: 42"

        button.on_click(compute)
        doc.add_root(column(button, result))


    app = BokehASGI(modify_document)

Uvicorn is installed with Bokeh. From that directory, start it:

.. code-block:: sh

    python -m uvicorn main:app

Uvicorn defaults to port 8000, while ``bokeh serve`` defaults to 5006.
Open ``http://localhost:8000/`` and click the button. The callback runs in
Python and changes the browser's document. Opening another tab creates a new
document with its own button and result.

``modify_document`` creates a document for each session. ``app`` exposes the
ASGI application. Creating it does not start a server. You can import the same
document function into another host without copying the plot or callback code.
When hosting needs more configuration, move that setup into ``server.py`` and
run ``python -m uvicorn server:app``.

Repository examples
-------------------

The repository examples use package imports so they can run from the repository
root. For example:

.. code-block:: sh

    python -m uvicorn examples.server.module_apps.getting_started.adjust_plot_with_sliders.main:app

See :bokeh-tree:`examples/server/module_apps/getting_started/adjust_plot_with_sliders`.
For a quick single-script alternative, see :ref:`ug_server_script_apps`.
