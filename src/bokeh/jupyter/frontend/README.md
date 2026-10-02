# Bokeh Jupyter renderer

This directory contains the handwritten source for Bokeh's first-party
JupyterLab and Notebook 7 renderer. Its prebuilt runtime assets are generated
into the parent `src/bokeh/jupyter/` package and shipped in the main Bokeh
wheel. Do not edit generated bundles directly.

Use the embedding project's dedicated environment, then run:

```sh
/Users/bryan/anaconda3/bin/conda run -n bokeh-embed npm ci
/Users/bryan/anaconda3/bin/conda run -n bokeh-embed npm run test:source
/Users/bryan/anaconda3/bin/conda run -n bokeh-embed npm run build
```

The build checks that the Python and TypeScript MIME protocol constants match,
type-checks the extension, builds the frontend, and copies its installation
metadata. `src/bokeh/jupyter/frontend/package.json` and
`bokehjs/package.json` must have the same version. Commit source and
regenerated assets together.

Focused validation from the repository root is:

```sh
cd src/bokeh/jupyter/frontend
/Users/bryan/anaconda3/bin/conda run -n bokeh-embed npm run test:source
cd ../../../..
/Users/bryan/anaconda3/bin/conda run -n bokeh-embed python -m pytest -o pythonpath=src tests/unit/bokeh/io/test_jupyter.py
/Users/bryan/anaconda3/bin/conda run -n bokeh-embed python -m pytest -o pythonpath=src tests/unit/bokeh/io/test_jupyter_runtime.py
/Users/bryan/anaconda3/bin/conda run -n bokeh-embed python -m pytest -o pythonpath=src tests/integration/test_jupyter_extension.py
```

The integration suite must run against an installed wheel. It checks automatic
extension discovery, trust boundaries, artifact MIME persistence, shared
resource deduplication, notebook comms, native browser links for safe relative
files, output replacement, reload, and the portable extension-disabled path. All
browser automation uses Playwright. Vitest exercises the handwritten source
directly before packaging, while Python tests separately verify the generated
assets. See the contributor guide's Jupyter integration section for protocol,
ownership, export correlation, and release details.
