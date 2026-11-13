#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
import pytest

import bokeh.models as models
from bokeh.core.property.vectorization import Value, field
from bokeh.models import NormalHead

# Module under test
import bokeh.models.graphics as bmg # isort:skip

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_graphics_models_are_exported() -> None:
    for name in bmg.__all__:
        assert getattr(models, name) is getattr(bmg, name)
        assert name in models.__all__


@pytest.mark.parametrize("positions", ["end", [0.5]])
def test_path_marking_owns_its_marking(positions) -> None:
    marking = NormalHead()
    decoration = bmg.PathPlacement(marking=marking, positions=positions)
    assert decoration.marking is marking


@pytest.mark.parametrize("positions", ["start", "middle", "end", [0.25, 1], []])
def test_path_positions_serialize_as_literal_values(positions) -> None:
    decoration = bmg.PathPlacement(marking=NormalHead(), positions=positions)
    descriptor = decoration.lookup("positions")
    assert descriptor.property.to_serializable(decoration, "positions", positions) == Value(positions)


def test_path_positions_can_reference_a_column_named_end() -> None:
    positions = field("end")
    decoration = bmg.PathPlacement(marking=NormalHead(), positions=positions)
    assert decoration.positions == positions
