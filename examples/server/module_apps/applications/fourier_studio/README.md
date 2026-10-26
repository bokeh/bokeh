# Fourier studio

Explore waveform harmonics with linked signal and spectrum plots. Start with
this example before comparing the surrounding pages in hosting and frameworks.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.applications.fourier_studio.main:app
```

Open <http://localhost:8000/>. `main.py` exposes `app` and the reusable document
function `modify_document(doc)`. Each session gets its own models.
The hosting and framework examples import that same function.
