# Stream OHLC data

Stream simulated OHLC prices and moving-average indicators.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.applications.stream_ohlc.app:app
```

Open [the application](http://localhost:8000/).
`app.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.
