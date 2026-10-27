# Embed in FastAPI

Start with the [standalone Fourier studio](../../applications/fourier_studio/).
This host imports the same document function and mounts it at `/bkapp`.

Additional dependency: FastAPI.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.frameworks.embed_in_fastapi.server:app
```

Open <http://localhost:8000/>. `server.py` owns routing and lifecycle.
`index.html` supplies the surrounding page.
