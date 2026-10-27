# Lock document callbacks

Schedule background updates safely under the session document lock.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.lifecycle.lock_document_callbacks.app:app
```

Open [the application](http://localhost:8000/).
`app.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.
