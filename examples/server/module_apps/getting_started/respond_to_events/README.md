# Respond to events

Respond to browser events with Python callbacks.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.getting_started.respond_to_events.main:app
```

Open [the application](http://localhost:8000/).
`main.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.
