# Process images

Apply image filters and compare their results.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.applications.process_images.app:app
```

Open [the application](http://localhost:8000/).
`app.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.

Additional dependencies: SciPy and pooch.

SciPy downloads its example image on first use. Later runs use the cache.
