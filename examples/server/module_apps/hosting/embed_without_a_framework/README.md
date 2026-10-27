# Embed without a framework

Start with the [standalone Fourier studio](../../applications/fourier_studio/).
This host imports the same document function and mounts it at `/bkapp`.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.hosting.embed_without_a_framework.server:app
```

Open <http://localhost:8000/>. `server.py` owns routing and lifecycle.
`index.html` supplies the surrounding page.
