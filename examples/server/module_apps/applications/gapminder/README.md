# Gapminder

Explore population, income and life expectancy over time.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.applications.gapminder.app:app
```

Open [the application](http://localhost:8000/).
`app.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.

Additional dependencies: pandas and bokeh_sampledata.
