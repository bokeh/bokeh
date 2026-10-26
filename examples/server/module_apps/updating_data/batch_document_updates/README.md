# Batch document updates

Compare collected and combined document updates.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.updating_data.batch_document_updates.app:app
```

Open [the application](http://localhost:8000/).
`app.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.
