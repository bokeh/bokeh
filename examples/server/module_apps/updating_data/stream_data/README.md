# Stream data

Append one point every 100 milliseconds and retain the most recent 100 points.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.updating_data.stream_data.app:app
```

Open [the application](http://localhost:8000/).
`app.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.
