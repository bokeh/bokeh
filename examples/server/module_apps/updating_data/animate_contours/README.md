# Animate contours

Update contours periodically from a changing scalar field.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.updating_data.animate_contours.app:app
```

Open [the application](http://localhost:8000/).
`app.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.
