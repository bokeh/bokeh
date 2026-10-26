# Embed in Streamlit

Start with the [standalone Fourier studio](../../applications/fourier_studio/).
This host imports the same document function and mounts it at `/bkapp`.

Additional dependency: Streamlit 1.57 with `st.App` support.

Run from the repository root:

```sh
STREAMLIT_THEME_BASE=dark python -m uvicorn examples.server.module_apps.frameworks.embed_in_streamlit.server:app
```

Open <http://localhost:8000/>. `server.py` owns routing and lifecycle.
`page.py` supplies the Streamlit interface.
