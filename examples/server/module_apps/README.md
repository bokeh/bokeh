# Module apps

Each application builds a fresh document in `modify_document(doc)`.
Simple examples expose `app` from `app.py` and run as `app:app`. Examples
with separate hosting setup run as `server:app` and keep document construction
in `app.py`.
Hosting and framework integrations give their exact entry points in their READMEs.
Run commands from the repository root so package imports work.

| Topic | Examples |
|---|---|
| [Getting started](getting_started/) | Sliders, events, visibility and themes |
| [Updating data](updating_data/) | Patching, batching, animation and shared data |
| [Lifecycle](lifecycle/) | Document locks, startup data and background audio |
| [Hosting](hosting/) | Authentication and embedding without a framework |
| [Frameworks](frameworks/) | FastAPI, Starlette, Django and Streamlit |
| [Applications](applications/) | Larger examples organized by domain |

For example:

```sh
python -m uvicorn examples.server.module_apps.getting_started.adjust_plot_with_sliders.app:app
```

Open <http://localhost:8000/>. Each browser session gets its own models.
See the Sphinx server guide for application forms, hosting and deployment.
