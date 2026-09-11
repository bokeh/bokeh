#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from pathlib import Path

# External imports
from isort.api import check_file
from isort.exceptions import FileSkipComment, FileSkipSetting
from isort.settings import Config

# Bokeh imports
from tests.support.util.project import TOP_PATH, ls_files

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

DIRECTORIES = (
    "src/bokeh",
    "examples",
    "tools",
    "docs/bokeh",
    "tests",
    "src/typings",
)

@pytest.mark.parametrize("directory", DIRECTORIES)
def test_isort(directory: str) -> None:
    files = isort(directory)
    assert not files, f"isort issues in {directory}:\n" + "\n".join(files)

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------

def isort(directory: str) -> list[str]:
    ''' Assures that the Python codebase imports are correctly sorted.

    '''
    config = Config(settings_path=str(TOP_PATH / directory))
    files = [file for file in ls_files(directory) if file.endswith((".py", ".pyi"))]
    return [
        file for file in files
        if not _is_sorted(TOP_PATH / file, config)
    ]

def _is_sorted(path: Path, config: Config) -> bool:
    try:
        return check_file(path, config=config, disregard_skip=False)
    except (FileSkipComment, FileSkipSetting):
        return True
