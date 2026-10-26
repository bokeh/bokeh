# Custom 3D extension

Display a three-dimensional surface using a custom extension.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.applications.custom_extension_3d.main:app
```

Open [the application](http://localhost:8000/).
`main.py` defines `modify_document(doc)` and the ASGI entry point `app`.
Each session gets fresh models.

This example compiles a TypeScript extension at startup and requires Node.js.
