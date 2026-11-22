#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportArgumentType=false, reportOverlappingOverload=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from typing import (
    TYPE_CHECKING,
    Any,
)

from ..document.document import Document
from ..model import Model
from ._util import ThemeSource

if TYPE_CHECKING:
    from ..core.types import ID
    from ..resources import ResourcesLike

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'autoload_static',
    'json_item',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def autoload_static(model: Model | Document, resources: ResourcesLike,
        script_path: str) -> tuple[str, str]:
    """Use ``embed(model).external(...)`` instead."""
    raise RuntimeError(
        "autoload_static() was removed. Use external = embed(model).external(payload_url=script_path) "
        "and save external.payload instead of generating a per-embed loader program.",
    )

def json_item(model: Model, target: ID | None = None, theme: ThemeSource = None) -> dict[str, Any]:
    """Use ``embed(model).to_dict()`` instead."""
    raise RuntimeError(
        "json_item() was removed. Use embed(model).to_dict() with Bokeh.mount(), "
        "or embed(model).external(...) for a declarative external payload.",
    )
