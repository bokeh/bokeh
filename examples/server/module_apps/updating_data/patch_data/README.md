# Patch data

Patch points, multiline values and image slices without replacing full arrays.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.updating_data.patch_data.app:app
```

Open [the application](http://localhost:8000/).
`app.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.
