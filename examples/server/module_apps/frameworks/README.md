# Framework integrations

These examples reuse the [Fourier application](../applications/fourier_studio/).
They add a surrounding page and mount Bokeh at `/bkapp`. Start with the
[framework-free host](../hosting/embed_without_a_framework/) if you do not need a web framework.

Start with [embed_in_fastapi](embed_in_fastapi/) to compare a framework host
with the framework-free host. Each directory has its own README and companions.

Install the framework used by the example in your application environment.
Run from the repository root, then open <http://localhost:8000/>:

```sh
python -m uvicorn examples.server.module_apps.frameworks.embed_in_fastapi.server:app
python -m uvicorn examples.server.module_apps.frameworks.embed_in_starlette.server:app
python -m uvicorn examples.server.module_apps.frameworks.embed_in_django.server:app
STREAMLIT_THEME_BASE=dark python -m uvicorn examples.server.module_apps.frameworks.embed_in_streamlit.server:app
python -m uvicorn examples.server.module_apps.frameworks.share_data_with_fastapi.server:app
STREAMLIT_THEME_BASE=dark python -m uvicorn examples.server.module_apps.frameworks.control_particles_with_streamlit.server:app
```

The Streamlit examples need `st.App` with ASGI routes. They were tested with
Streamlit 1.57.
`embed_in_streamlit/page.py` is the companion UI for its `server.py` host.

## Lifecycle and shared data

FastAPI and Starlette do not send lifespan events to mounted applications.
The parent starts and stops Bokeh explicitly. The shared-data host also owns
one producer and reuses the [raw ASGI producer](../lifecycle/share_data_with_asgi/).
Snapshots update independent session models under their document locks.

## Streamlit particles

`control_particles_with_streamlit/` keeps separate state for each viewer.
Streamlit widgets publish control snapshots. Bokeh renders and animates the
particles in the browser. Python sends binary arrays on reset, rather than
sending every animation frame.

`server.py` owns the host lifecycle. `ui.py` defines controls. `state.py` protects
viewer state. `simulation.py` builds documents. `modes.toml` describes the
simulation modes and `js/README.md` documents the JavaScript kernels.

The viewer registry and shared-data producer are local to one process.
Multiple workers need an external store or broker.
