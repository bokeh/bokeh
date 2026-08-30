from __future__ import annotations

# Standard library imports
from pickle import dumps, loads
from types import SimpleNamespace
from typing import Any, cast

# Bokeh imports
from bokeh.sphinxext._internal.bokeh_model import (
    _env_merge_info as merge_model_timings,
    _ModelTiming,
)
from bokeh.sphinxext._internal.bokeh_timing import (
    _DocsProfile,
    _setup_docs_profile,
    _start_docs_write,
)
from bokeh.sphinxext.bokeh_plot import _PlotTiming, env_merge_info as merge_plot_timings


def test_setup_docs_profile_registers_phase_hooks() -> None:
    connections = []

    def connect(event: str, callback: Any, priority: int = 500) -> None:
        connections.append((event, callback.__name__, priority))

    _setup_docs_profile(SimpleNamespace(connect=connect))

    assert connections == [
        ("builder-inited", "_start_docs_profile", 999),
        ("env-before-read-docs", "_start_docs_read", 500),
        ("env-updated", "_finish_docs_read", 999),
        ("write-started", "_start_docs_write", 100),
        ("build-finished", "_log_docs_profile", 999),
    ]


def test_start_docs_write_times_main_process_operations() -> None:
    calls = []

    def resolve(docname: str, value: int) -> tuple[str, int]:
        calls.append(("resolve", docname, value))
        return docname, value

    def serialize(docname: str, value: int) -> tuple[str, int]:
        calls.append(("serialize", docname, value))
        return docname, value

    env = SimpleNamespace(get_and_resolve_doctree=resolve)
    builder = SimpleNamespace(env=env, write_doc_serialized=serialize)
    app = SimpleNamespace(_bokeh_docs_profile=_DocsProfile(started=0.0))

    _start_docs_write(cast(Any, app), cast(Any, builder))

    assert env.get_and_resolve_doctree("document", 1) == ("document", 1)
    assert builder.write_doc_serialized("document", 2) == ("document", 2)
    assert calls == [
        ("resolve", "document", 1),
        ("serialize", "document", 2),
    ]
    assert app._bokeh_docs_profile.resolve_timings[0].docname == "document"
    assert app._bokeh_docs_profile.serialize_timings[0].docname == "document"


def test_merge_plot_timings_only_includes_worker_docnames() -> None:
    included = _PlotTiming(
        total=1.0,
        evaluate=0.4,
        serialize=0.5,
        write=0.1,
        docname="included",
        source="included.py",
    )
    inherited = _PlotTiming(
        total=2.0,
        evaluate=0.8,
        serialize=1.0,
        write=0.2,
        docname="inherited",
        source="inherited.py",
    )
    env = SimpleNamespace(bokeh_plot_files=set(), bokeh_plot_timings=[])
    other = SimpleNamespace(
        bokeh_plot_files={"plot.js"},
        bokeh_plot_timings=[inherited, included],
    )

    merge_plot_timings(None, cast(Any, env), ["included"], cast(Any, other))

    assert env.bokeh_plot_files == {"plot.js"}
    assert env.bokeh_plot_timings == [included]


def test_merge_model_timings_only_includes_worker_docnames() -> None:
    included = _ModelTiming(
        total=1.0,
        generate=0.1,
        parse=0.8,
        post_process=0.1,
        docname="included",
        model_name="Included",
    )
    inherited = _ModelTiming(
        total=2.0,
        generate=0.2,
        parse=1.6,
        post_process=0.2,
        docname="inherited",
        model_name="Inherited",
    )
    env = SimpleNamespace(bokeh_model_timings=[])
    other = SimpleNamespace(bokeh_model_timings=[inherited, included])

    merge_model_timings(None, cast(Any, env), ["included"], cast(Any, other))

    assert env.bokeh_model_timings == [included]


def test_timing_records_are_pickle_safe() -> None:
    timings = [
        _PlotTiming(
            total=1.0,
            evaluate=0.4,
            serialize=0.5,
            write=0.1,
            docname="plot",
            source="plot.py",
        ),
        _ModelTiming(
            total=1.0,
            generate=0.1,
            parse=0.8,
            post_process=0.1,
            docname="model",
            model_name="Model",
        ),
    ]

    assert loads(dumps(timings)) == timings
