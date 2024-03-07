# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""
from __future__ import annotations

# Standard library imports
import pickle

# Bokeh imports
from .config import Config
from .pipeline import StepType

__all__ = ("skip_for_prerelease",)

CONFIG_FILENAME = "bokeh-build-config.pickle"

def load_config() -> Config:
    with open(CONFIG_FILENAME, "rb") as f:
        return pickle.load(f)

def save_config(config: Config) -> None:
    with open(CONFIG_FILENAME, "wb") as f:
        pickle.dump(config, f)

def skip_for_prerelease(func: StepType) -> StepType:
    func.skip_for_prerelease = True  # type: ignore
    return func
