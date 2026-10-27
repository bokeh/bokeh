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
import importlib.util
import re
import sys
from dataclasses import replace
from types import ModuleType
from typing import Any

import pytest

from tests.support.util.project import TOP_PATH

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

def _load_api_reference() -> ModuleType:
    spec = importlib.util.spec_from_file_location("api_reference", TOP_PATH / "docs" / "bokeh" / "api_reference" / "__main__.py")
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module

api_reference = _load_api_reference()

REGISTRY = "docs/bokeh/api_reference/sections.json"

def _without(sections: list[Any], *names: str) -> list[Any]:
    return [replace(section, classes=tuple(name for name in section.classes if name not in names)) for section in sections]

def _with(sections: list[Any], slug: str, *names: str) -> list[Any]:
    return [replace(section, classes=(*section.classes, *names)) if section.slug == slug else section for section in sections]

def _section_by_name(sections: list[Any]) -> dict[str, str]:
    return {ref.name: ref.section for ref in api_reference._load_public_classes(sections)}

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_infer_section() -> None:
    slugs = {"glyphs", "widgets", "widgets/sliders"}
    assert api_reference._infer_section("bokeh.models.widgets.sliders", slugs) == "widgets/sliders"
    assert api_reference._infer_section("bokeh.models.widgets.buttons", slugs) == "widgets"
    assert api_reference._infer_section("bokeh.models.glyph", slugs) is None
    assert api_reference._infer_section("bokeh.core.properties", slugs) is None

def test_unregistered_classes_are_assigned_from_their_module() -> None:
    sections = api_reference._load_sections()
    expected = _section_by_name(sections)

    actual = _section_by_name(_without(sections, "RangeSlider", "ScaleBar"))
    assert actual["RangeSlider"] == "widgets/sliders"
    assert actual["ScaleBar"] == "annotations"
    assert actual == expected

def test_registered_classes_override_their_module() -> None:
    sections = api_reference._load_sections()
    assert _section_by_name(sections)["Glyph"] == "glyphs"

    moved = _with(_without(sections, "ScaleBar"), "glyphs", "ScaleBar")
    assert _section_by_name(moved)["ScaleBar"] == "glyphs"

def test_unassignable_class_reports_how_to_fix() -> None:
    sections = _without(api_reference._load_sections(), "Glyph")
    message = (
        "cannot infer the section of public class 'Glyph' from its module 'bokeh.models.glyph'; "
        f"add 'Glyph' to the classes of a section in {REGISTRY}"
    )
    with pytest.raises(RuntimeError, match=re.escape(message)):
        api_reference._load_public_classes(sections)

def test_stale_registered_class_reports_how_to_fix() -> None:
    sections = _with(api_reference._load_sections(), "glyphs", "NotAModel")
    message = f"unknown registered classes: NotAModel; remove them from {REGISTRY}"
    with pytest.raises(RuntimeError, match=re.escape(message)):
        api_reference._load_public_classes(sections)
