# Share data with FastAPI

This host reuses the [shared-data document](../../updating_data/share_data_between_sessions/)
and the [async producer](../../lifecycle/share_data_with_asgi/).

Additional dependency: FastAPI.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.frameworks.share_data_with_fastapi.server:app
```

Open <http://localhost:8000/>. `server.py` owns routing and lifecycle.
