#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved. The full license is in the file LICENSE.txt.
#-----------------------------------------------------------------------------
from __future__ import annotations

import pytest

from bokeh.core.has_props import HasProps
from bokeh.models import HTMLLabelSet, ImageURL, LabelSet, LegendItem


@pytest.mark.parametrize(("model", "name", "description"), [
    (ImageURL, "w", "The width of the plot region"),
    (ImageURL, "h", "The height of the plot region"),
    (LabelSet, "text", "The text values to render."),
    (HTMLLabelSet, "text", "The text values to render."),
    (LegendItem, "label", "A label for this legend."),
])
def test_migrated_nullable_spec_help(model: type[HasProps], name: str, description: str) -> None:
    descriptor = model.lookup(name)
    assert descriptor.__doc__ is not None
    assert description in descriptor.__doc__
    assert model.dataspecs()[name].help == descriptor.property.help == descriptor.__doc__
