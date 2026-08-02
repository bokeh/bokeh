# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import annotations

import re
from types import MethodType
from typing import Any

from . import PARALLEL_SAFE, SphinxParallelSpec

_MODEL_CLASS_DOCNAME = re.compile(
    r"^docs/reference/models/(?:[a-z_][a-z0-9_]*/)+[A-Z][A-Za-z0-9_]*/index$",
)


def _model_class_uri(docname: str, uri: str, link_suffix: str) -> str:
    """Return the directory-style URI for a generated model class page."""
    tail = f"index{link_suffix}"
    if _MODEL_CLASS_DOCNAME.fullmatch(docname) and uri.endswith(tail):
        return uri[: -len(tail)]
    return uri


def _builder_inited(app: Any) -> None:
    builder = app.builder
    if builder.format != "html":
        return

    get_target_uri = builder.get_target_uri

    def get_model_target_uri(self: Any, docname: str, typ: str | None = None) -> str:
        uri = get_target_uri(docname, typ)
        return _model_class_uri(docname, uri, self.link_suffix)

    builder.get_target_uri = MethodType(get_model_target_uri, builder)


def setup(app: Any) -> SphinxParallelSpec:
    app.connect("builder-inited", _builder_inited)
    return PARALLEL_SAFE
