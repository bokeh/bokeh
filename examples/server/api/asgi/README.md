# Embedding Bokeh in ASGI applications

Each example mounts the framework-neutral `BokehASGI` application at `/bkapp`.
The host application handles every other route. `framework_free.py` implements
the ASGI routing directly. The FastAPI, Starlette, Django, and framework-free
examples render `index.html` and call `server_document()` to embed the signal
studio in the page. `fourier_studio.py` exports a `modify_document(doc)`
function that builds a small Fourier-series lab with linked signal and harmonic
spectrum plots.

The simple Streamlit example registers `/bkapp` as an `st.App` route and opens
it with `st.iframe()`. Each host passes the same `modify_document` function to
`BokehASGI`. Bokeh calls it once for every session, making the per-session model
ownership explicit and keeping the application easy to import and test. Path
arguments remain useful for arbitrary Bokeh script and directory applications,
but these examples own regular Python modules and do not need script loading.

`fastapi_shared_data.py` has a background producer owned by the FastAPI
lifespan. A new Bokeh session starts with the latest immutable snapshot.
`BokehASGI.update_sessions()` applies later snapshots to each local session
document.

## Streamlit particle example

`streamlit_particles/` pairs per-viewer Streamlit controls with a Bokeh
simulation that runs in the browser. Four files divide the work:

- `ui.py` defines the Streamlit widgets and assigns an opaque viewer ID.
- `state.py` holds one thread-safe Python snapshot for each viewer.
- `simulation.py` exports `modify_document`, which polls the snapshot, updates
  the Bokeh document, and creates new particle arrays with NumPy on reset. It
  also replaces the `CustomJS` kernel when the simulation mode changes.
- `js/driver.js` runs the browser animation loop and calls one of the seven
  mode kernels for each frame.

A document-level event callback does not own the models that it references, so
the driver is also added as a non-visual document root. This keeps its control
source and active kernel attached to the document and synchronized through the
Bokeh WebSocket.

On reset, Python sends 50,000-point `float32` arrays as binary buffers. Later
frames update those arrays in the browser, where Bokeh renders them with WebGL.
Python does not calculate or send particle positions for each frame.

`modes.toml` contains the labels, equations, explanations, and references for
each mode. `modes.py` converts the catalog into typed records. Codex generated
the simulation JavaScript for this example. `js/README.md` describes the callback
contract and identifies the numerical choices made for the demo.

The field centers are Bokeh glyphs controlled by a `PointDrawTool`. Dragging a
center sends its coordinates to a Python `on_change` callback, which reports the
mode-specific separation. Streamlit fragments prevent control and monitor
updates from remounting the Bokeh iframe.

The viewer registry is local to one process. A deployment with multiple workers
would need an external store or message broker.

The ASGI unit tests import both document functions, create independent sessions,
and verify callback updates, the 50,000-point `float32` payloads, browser-side
kernels, mount routing, and host-managed lifespans. They use light stand-ins for
optional web frameworks, so the core Bokeh test environment does not need
Streamlit, FastAPI, or Starlette installed.

The nightly server E2E suite complements those unit tests with the real
frameworks and Chromium. It launches every entry point under both Uvicorn and
Hypercorn, exercises Python callbacks and shared-data updates over live Bokeh
WebSockets, confirms the particle arrays evolve in the browser, and checks that
two Streamlit viewers retain independent state.

## Application lifespan

FastAPI and Starlette do not pass lifespan events to mounted applications. The
host lifespan therefore starts and stops Bokeh so that its server load and
unload hooks run. The Streamlit example uses the user lifespan accepted by
`st.App` for the same purpose.

## Running the examples

From this directory, install an ASGI server and the framework required by the
chosen example, then run one of these commands:

```sh
python -m uvicorn framework_free:application --port 8000
python -m uvicorn fastapi_embed:app --port 8000
python -m uvicorn fastapi_shared_data:app --port 8000
python -m uvicorn starlette_embed:app --port 8000
python -m uvicorn django_embed:application --port 8000
python -m uvicorn streamlit_simple:app --port 8000
python -m uvicorn streamlit_particles.app:app --port 8000
```

Open <http://localhost:8000/>. Any ASGI 3 server, such as Hypercorn, can replace
Uvicorn. The framework-free example requires only Bokeh and an ASGI server.
FastAPI, Starlette, and Django are dependencies of their respective examples,
not of Bokeh. The Streamlit examples require Streamlit 1.57 or newer.
