# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
from unittest.mock import MagicMock, patch

# Bokeh imports
import bokeh.io.output as bio
from bokeh.resources import Resources


@patch("bokeh.io.output.run_notebook_hook")
@patch("bokeh.io.output._activate_notebook")
def test_output_notebook_activates_and_loads_default_hook(mock_activate: MagicMock,
        mock_run_notebook_hook: MagicMock) -> None:
    bio.output_notebook()
    mock_activate.assert_called_once_with("jupyter")
    mock_run_notebook_hook.assert_called_once_with("jupyter", "load", None, False, False, 5000)


@patch("bokeh.io.output.run_notebook_hook")
@patch("bokeh.io.output._activate_notebook")
def test_output_notebook_passes_policy_and_options(mock_activate: MagicMock,
        mock_run_notebook_hook: MagicMock) -> None:
    policy = Resources(mode="inline")
    bio.output_notebook(policy, True, True, 1000, "jupyter")
    mock_activate.assert_called_once_with("jupyter")
    mock_run_notebook_hook.assert_called_once_with("jupyter", "load", policy, True, True, 1000)
