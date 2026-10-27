# Weather

Explore historical weather data with linked plots.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.applications.weather.app:app
```

Open [the application](http://localhost:8000/).
`app.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.

Additional dependencies: pandas and SciPy.
