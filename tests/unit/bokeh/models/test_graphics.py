#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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

# Bokeh imports
from bokeh.models import NormalHead
import bokeh.models as models

# Module under test
import bokeh.models.graphics as bmg # isort:skip

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_graphics_models_are_exported() -> None:
    for name in bmg.__all__:
        assert getattr(models, name) is getattr(bmg, name)
        assert name in models.__all__


def test_decoration_base_has_no_marking_or_path_placement() -> None:
    assert set(bmg.Decoration.properties()).isdisjoint({"marking", "node", "inset", "positions"})


@pytest.mark.parametrize("model", [bmg.PathDecoration, bmg.PathMarkings])
def test_path_decorations_own_their_marking(model) -> None:
    marking = NormalHead()
    decoration = model(marking=marking)
    assert isinstance(decoration, bmg.Decoration)
    assert decoration.marking is marking
