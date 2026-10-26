# Animate fourier series

Animate a Fourier series with periodic document updates.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.updating_data.animate_fourier_series.main:app
```

Open [the application](http://localhost:8000/).
`main.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.
