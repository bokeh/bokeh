# Clustering

Compare clustering algorithms on generated datasets.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.applications.clustering.main:app
```

Open [the application](http://localhost:8000/).
`main.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.

Additional dependencies: scikit-learn.
