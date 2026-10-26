# Share data between sessions

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.updating_data.share_data_between_sessions.server:app
```

Open two tabs at <http://localhost:8000/>. Each session owns its models.
The host owns one producer and sends its snapshots to every session.
