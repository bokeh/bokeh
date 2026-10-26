# Own shared data with an ASGI lifespan

Start with [the Application lifecycle version](../../updating_data/share_data_between_sessions/)
to learn shared data without writing an ASGI lifespan.

This version teaches host ownership. `server.py` starts Bokeh and one async
producer, handles shutdown and reports failures. `producer.py` publishes shared
snapshots under each session's document lock. The document function and data
store are reused from the simpler example.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.lifecycle.share_data_with_asgi.server:app
```

Open two tabs at <http://localhost:8000/>. Each session owns its models.
The [FastAPI host](../../frameworks/share_data_with_fastapi/) reuses this producer
and expresses its ownership through the framework's lifespan API.
