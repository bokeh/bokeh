# Adjust plot with sliders

Adjust a sine wave with sliders and a Python callback.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.getting_started.adjust_plot_with_sliders.app:app
```

Open [the application](http://localhost:8000/).
`app.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.

Compare the [script version](../../../script_apps/adjust_plot_with_sliders.py)
to see how the same widgets and callbacks move into `modify_document(doc)`.
The module version can be imported by another host.
