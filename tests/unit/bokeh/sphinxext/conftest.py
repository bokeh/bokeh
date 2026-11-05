from __future__ import annotations

from importlib.util import find_spec

# Documentation dependencies are optional in the core test environment.
collect_ignore = []

if find_spec("sphinx") is None:
    collect_ignore.extend([
        "test_bokeh_autodoc.py",
        "test_bokeh_instrumentation.py",
        "test_bokeh_model.py",
        "test_bokeh_parallel.py",
        "test_bokeh_plot.py",
        "test_bokeh_plot_metadata.py",
        "test_bokeh_sampledata_xref.py",
        "test_bokeh_sitemap.py",
        "test_bokeh_toc.py",
    ])
