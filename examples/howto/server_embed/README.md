### `flask_embed.py`

Run with `python flask_embed.py` and open http://localhost:8000/ in a web browser.

### `flask_gunicorn_embed.py`

Run with `gunicorn -w 4 flask_gunicorn_embed:app`

A UNIX environment is required to run this script.

### `notebook_embed.ipynb`

requires [Jupyter Notebook](https://jupyter.org/).

### `standalone_embed.py`

Run with `python standalone_embed.py`.

On Windows, the `num_procs=4` argument must be removed from the Server initialisation call on line 34.

### `tornado_embed.py`

Run with `python tornado_embed.py`.

On Windows, the `num_procs=4` argument must be removed from the Server initialisation call on line 47.
