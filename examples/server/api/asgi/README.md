# Embedding Bokeh in ASGI applications

Each example mounts the framework-neutral `BokehASGI` application at `/bkapp`
and leaves the rest of the site to its host application. `framework_free.py`
shows the ASGI path dispatch directly, without another web framework. All four
hosts render the shared `index.html` page and use `server_document()` to embed
the same interactive signal-studio application directly into the host page.
The Bokeh application in `bkapp.py` is an ordinary script application loaded
by passing its `Path` directly to `BokehASGI`.

`fastapi_shared_data.py` is a separate, compact example with one background
producer owned by the FastAPI lifespan. New Bokeh sessions start from its
latest immutable snapshot, and `BokehASGI.update_sessions()` safely applies
each subsequent snapshot to every local session document.

FastAPI and Starlette do not forward lifespan events to mounted applications.
Those examples therefore start and stop Bokeh explicitly from the host
application's lifespan context so that server load and unload hooks run.

From this directory, install an ASGI server and any framework required by the
chosen example, then run one of:

```sh
python -m uvicorn framework_free:application --port 8000
python -m uvicorn fastapi_embed:app --port 8000
python -m uvicorn fastapi_shared_data:app --port 8000
python -m uvicorn starlette_embed:app --port 8000
python -m uvicorn django_embed:application --port 8000
```

Open <http://localhost:8000/>. Uvicorn can be replaced with any ASGI 3 server,
such as Hypercorn. The framework-free example needs only Bokeh and an ASGI
server. FastAPI, Starlette, and Django are example-only dependencies and are
not required by Bokeh.
