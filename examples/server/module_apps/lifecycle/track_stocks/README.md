# Track stocks

Compare bundled historical stock prices with interactive controls.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.lifecycle.track_stocks.server:app
```

Open [the application](http://localhost:8000/).
`app.py` creates fresh models in `modify_document(doc)` for each session.
`server.py` supplies the ASGI host configuration.

Additional dependencies: pandas and bokeh_sampledata.

The application loads bundled historical prices once at startup.
No external finance service is required.

This version uses bundled historical sample data from 2000–2013 rather than
downloading current prices. Install `bokeh_sampledata` and pandas to run it.
