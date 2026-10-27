# Switch light dark theme

Switch the document between light and dark themes.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.getting_started.switch_light_dark_theme.app:app
```

Open [the application](http://localhost:8000/).
`app.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.
