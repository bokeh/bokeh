#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

# External imports
import pytest

# Bokeh imports
import bokeh.embed.elements as bee
from bokeh.embed import EmbedMigrationError


@pytest.mark.parametrize("name", [
    "div_for_render_item",
    "html_page_for_render_items",
    "script_for_render_items",
])
def test_removed_render_item_helpers_raise_actionable_migration(name: str) -> None:
    with pytest.raises(EmbedMigrationError, match=r"EmbedArtifact.*page\(\).*fragment\(\)"):
        getattr(bee, name)()
