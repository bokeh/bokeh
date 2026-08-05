from __future__ import annotations

# Standard library imports
from importlib.util import find_spec

# Documentation dependencies are optional in the core test environment.
collect_ignore = []

if find_spec("sphinx") is None:
    collect_ignore.extend([
        "test_bokeh_model.py",
        "test_bokeh_sitemap.py",
    ])

if find_spec("docutils") is None:
    collect_ignore.append("test_bokeh_toc.py")
