# Control particles with Streamlit

Streamlit widgets set simulation controls while Bokeh renders particles in the
browser. Each viewer has independent state. Start with
[embed_in_streamlit](../embed_in_streamlit/) for the smaller integration example.

Install Streamlit 1.57 with `st.App` support. Run from the repository root:

```sh
STREAMLIT_THEME_BASE=dark python -m uvicorn examples.server.module_apps.frameworks.control_particles_with_streamlit.server:app
```

Open <http://localhost:8000/>. `server.py` owns routing and lifecycle. `ui.py`
defines the Streamlit interface. `simulation.py` builds the Bokeh document.
`state.py` protects viewer state and `modes.toml` describes simulation modes.
See [the JavaScript kernels](js/README.md) for browser animation details.

Viewer state is local to one process. Multiple workers need a shared store.
