# Share data between sessions

One producer computes snapshots. Each session owns its models and applies the
latest snapshot with a periodic callback. The producer changes data, not models.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.updating_data.share_data_between_sessions.server:app
```

Open two tabs at <http://localhost:8000/>. `app.py` defines the shared snapshots
and document function. `server.py` uses Application lifecycle hooks to start one
producer thread and stop it when the application shuts down.

The [raw ASGI lifecycle version](../../lifecycle/share_data_with_asgi/) uses the
same document function and snapshots but lets the host own an async producer.
No ASGI lifespan implementation is needed for this Application-based version.
