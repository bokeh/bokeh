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

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_importlib_metadata_works() -> None:
    import bokeh # isort:skip # noqa
    import importlib.metadata # isort:skip

    assert importlib.metadata is not None
