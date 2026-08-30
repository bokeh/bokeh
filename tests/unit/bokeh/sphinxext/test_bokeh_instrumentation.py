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
from bokeh.sphinxext.bokeh_plot import _PlotTiming, env_merge_info as merge_plot_timings


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
