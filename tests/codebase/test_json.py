#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc. All rights reserved.
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
from typing import List

# Bokeh imports
from bokeh._testing.util.project import TOP_PATH

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

paths = [
    "bokeh/_sri.json",
    "bokeh/util/sampledata.json",
    "sphinx/source/docs/gallery.json",
    "sphinx/versions.json",
]

def test_json() -> None:
    ''' Assures that JSON files are properly formatted

    '''
    bad: List[str] = []

    for path in paths:
        f = open(TOP_PATH/path)
        try:
            json.load(f)
        except Exception as e:
            bad.append(f"{path}: {e}" )

    assert len(bad) == 0, "Malformed JSON detected:\n" + ",".join(bad)

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------
