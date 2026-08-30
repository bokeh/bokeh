from __future__ import annotations

# Standard library imports
from types import SimpleNamespace
from typing import Any, cast

# Bokeh imports
from bokeh.sphinxext._internal.bokeh_model import _env_merge_info as merge_model_timings
from bokeh.sphinxext.bokeh_plot import env_merge_info as merge_plot_timings


def test_merge_plot_timings_only_includes_worker_docnames() -> None:
    included = (1.0, 0.4, 0.5, 0.1, "included", "included.py")
    inherited = (2.0, 0.8, 1.0, 0.2, "inherited", "inherited.py")
    env = SimpleNamespace(bokeh_plot_files=set(), bokeh_plot_timings=[])
    other = SimpleNamespace(
        bokeh_plot_files={"plot.js"},
        bokeh_plot_timings=[inherited, included],
    )

    merge_plot_timings(None, cast(Any, env), ["included"], cast(Any, other))

    assert env.bokeh_plot_files == {"plot.js"}
    assert env.bokeh_plot_timings == [included]


def test_merge_model_timings_only_includes_worker_docnames() -> None:
    included = (1.0, 0.1, 0.8, 0.1, "included", "Included")
    inherited = (2.0, 0.2, 1.6, 0.2, "inherited", "Inherited")
    env = SimpleNamespace(bokeh_model_timings=[])
    other = SimpleNamespace(bokeh_model_timings=[inherited, included])

    merge_model_timings(None, cast(Any, env), ["included"], cast(Any, other))

    assert env.bokeh_model_timings == [included]
