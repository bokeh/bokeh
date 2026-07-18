# Embedding Bokeh in ASGI applications

Each example mounts the framework-neutral `BokehASGI` application at `/bkapp`
and leaves the rest of the site to its host framework.

From this directory, install an ASGI server and the framework for the example,
then run one of:

```sh
python -m uvicorn fastapi_embed:app --port 8000
python -m uvicorn starlette_embed:app --port 8000
python -m uvicorn django_embed:application --port 8000
```

Open <http://localhost:8000/>. Uvicorn can be replaced with any ASGI 3 server,
such as Hypercorn. FastAPI, Starlette, Django, and Uvicorn are example-only
dependencies and are not required by Bokeh.
