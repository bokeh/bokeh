- `flask_embed.py` rename to _main.py_, run with `python main.py`, and open http://127.0.0.1:8000/ in a web browser.
- `flask_gunicorn_embed.py` a UNIX environment is required to run this script.
- `notebook_embed.ipynb` requires [Jupyter Notebook](https://jupyter.org/).
- `standalone_embed.py` rename to _main.py_ and run with `python main.py`. On Windows, the `num_procs=4` argument must
be removed from the Server initialisation call on line 34.
- `tornado_embed.py` rename to _main.py_ and run with `python main.py`. On Windows, the `num_procs=4` argument must be
removed from the Server initialisation call on line 47. Note: the `static/` end point is reserved for Bokeh resources,
as specified in [bokeh.server.urls](https://bokeh.pydata.org/en/latest/docs/reference/server/urls.html). In order to
make your own end point for static resources, add the following to the `extra_patterns` argument, replacing `DIR` with
the desired directory
`(r'/DIR/(.*)', StaticFileHandler, {'path': os.path.normpath(os.path.dirname(__file__) + '/DIR')})`.
