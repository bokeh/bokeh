# Dashboard

Filter dashboard data using widgets and a custom page template.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.applications.dashboard.server:app
```

Open [the application](http://localhost:8000/).
`app.py` creates fresh models in `modify_document(doc)` for each session.
`server.py` supplies the ASGI host configuration.

Additional dependencies: pandas and bokeh_sampledata.
