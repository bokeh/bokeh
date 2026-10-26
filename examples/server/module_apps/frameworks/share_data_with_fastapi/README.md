# Share data with FastAPI

This host reuses the [shared-data application and producer](../../updating_data/share_data_between_sessions/).

Additional dependency: FastAPI.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.frameworks.share_data_with_fastapi.server:app
```

Open <http://localhost:8000/>. `server.py` owns routing and lifecycle.
