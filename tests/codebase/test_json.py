#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc. All rights reserved.
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
import json

# Bokeh imports
from tests.support.util.project import TOP_PATH

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

paths = [
    "src/bokeh/_sri.json",
    "src/bokeh/util/sampledata.json",
    "docs/bokeh/source/docs/gallery.json",
    "docs/bokeh/switcher.json",
]

def test_json() -> None:
    ''' Assures that JSON files are properly formatted

    '''
    bad: list[str] = []

    for path in paths:
        with (TOP_PATH/path).open() as f:
            try:
                json.load(f)
            except Exception as e:
                bad.append(f"{path}: {e}" )

    assert len(bad) == 0, "Malformed JSON detected:\n" + ",".join(bad)

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------
