#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json

from . import TOP_PATH

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
    bad = []

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
