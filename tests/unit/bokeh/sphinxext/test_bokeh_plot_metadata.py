from __future__ import annotations

from io import StringIO
from pathlib import Path
from types import SimpleNamespace
from typing import Any

from sphinx.application import Sphinx
from sphinx.testing.util import _clean_up_global_state

from bokeh.sphinxext.bokeh_plot import env_merge_info, env_purge_doc


def test_plot_file_merge_uses_worker_document_ownership() -> None:
    env = SimpleNamespace(bokeh_plot_files={"parent": {"parent.json"}}, bokeh_plot_timings=[])
    other = SimpleNamespace(
        bokeh_plot_files={"parent": {"inherited.json"}, "worker": {"worker.json"}},
        bokeh_plot_timings=[],
    )
    env_merge_info(None, env, ["worker"], other)
    assert env.bokeh_plot_files == {"parent": {"parent.json"}, "worker": {"worker.json"}}
    env_purge_doc(None, env, "worker")
    env_purge_doc(None, env, "missing")
    assert env.bokeh_plot_files == {"parent": {"parent.json"}}


def test_plot_metadata_survives_incremental_edits_and_removal(tmp_path: Path) -> None:
    source = tmp_path / "source"
    example = source / "docs/examples/apple.rst"
    example.parent.mkdir(parents=True)
    (source / "conf.py").write_text(
        "extensions = ['bokeh.sphinxext.bokeh_plot']\n"
        "master_doc = 'index'\n",
    )
    index = source / "index.rst"
    index.write_text("Examples\n========\n\n.. toctree::\n\n    docs/examples/apple\n")
    text = """Apple
=====

.. bokeh-plot::

    # bokeh.sampledata.iris
    from bokeh.models import Div
    from bokeh.io import show
    show(Div(text="example"))
"""
    example.write_text(text)
    warnings = StringIO()
    def build() -> Sphinx:
        _clean_up_global_state()
        app = Sphinx(str(source), str(source), str(tmp_path / "html"), str(tmp_path / "doctrees"), "html",
                     status=StringIO(), warning=warnings, warningiserror=True)
        app.build()
        assert app.statuscode == 0, warnings.getvalue()
        return app

    app = build()
    try:
        env: Any = app.env
        original = set(env.bokeh_plot_files["docs/examples/apple"])
        assert len(original) == 1
        example.write_text(text.replace("sampledata.iris", "sampledata.flowers"))
        app = build()
        env = app.env
        replacement = env.bokeh_plot_files["docs/examples/apple"]
        assert len(replacement) == 1 and replacement.isdisjoint(original)
        example.unlink()
        index.write_text("Examples\n========\n")
        app = build()
        env = app.env
        assert env.bokeh_plot_files == {}
    finally:
        _clean_up_global_state()
