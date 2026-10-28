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

import bokeh.models as models
from tests.support.util.project import TOP_PATH

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

REGISTRY = "docs/bokeh/api_reference/sections.json"

@pytest.fixture(scope="module")
def api_reference() -> ModuleType:
    spec = importlib.util.spec_from_file_location("api_reference", TOP_PATH / "docs" / "bokeh" / "api_reference" / "__main__.py")
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    # dataclasses look up their module in sys.modules while the module executes
    with pytest.MonkeyPatch.context() as mp:
        mp.setitem(sys.modules, spec.name, module)
        spec.loader.exec_module(module)
    return module

def _without(sections: list[Any], *names: str) -> list[Any]:
    return [replace(section, classes=tuple(name for name in section.classes if name not in names)) for section in sections]

def _with(sections: list[Any], slug: str, *names: str) -> list[Any]:
    return [replace(section, classes=(*section.classes, *names)) if section.slug == slug else section for section in sections]

def _section_by_name(api_reference: ModuleType, sections: list[Any]) -> dict[str, str]:
    return {ref.name: ref.section for ref in api_reference._load_public_classes(sections)}

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_infer_section(api_reference: ModuleType) -> None:
    slugs = {"glyphs", "widgets", "widgets/sliders"}
    assert api_reference._infer_section("bokeh.models.widgets.sliders", slugs) == "widgets/sliders"
    assert api_reference._infer_section("bokeh.models.widgets.buttons", slugs) == "widgets"
    assert api_reference._infer_section("bokeh.models.glyph", slugs) is None
    assert api_reference._infer_section("bokeh.core.properties", slugs) is None

def test_unregistered_classes_are_assigned_from_their_module(api_reference: ModuleType) -> None:
    section_by_name = _section_by_name(api_reference, api_reference._load_sections())
    assert section_by_name["RangeSlider"] == "widgets/sliders"
    assert section_by_name["ScaleBar"] == "annotations"

def test_registered_classes_override_their_module(api_reference: ModuleType) -> None:
    sections = api_reference._load_sections()
    assert _section_by_name(api_reference, sections)["Glyph"] == "glyphs"
    assert _section_by_name(api_reference, _with(sections, "glyphs", "ScaleBar"))["ScaleBar"] == "glyphs"

def test_registry_lists_only_overrides(api_reference: ModuleType) -> None:
    sections = api_reference._load_sections()
    slugs = {section.slug for section in sections}
    redundant = [
        f"{name} (inferred as {section.slug!r})"
        for section in sections
        for name in section.classes
        if api_reference._infer_section(getattr(models, name).__module__, slugs) == section.slug
    ]
    assert redundant == [], f"remove redundant entries from {REGISTRY}: {', '.join(redundant)}"

def test_unassignable_class_reports_how_to_fix(api_reference: ModuleType) -> None:
    sections = _without(api_reference._load_sections(), "Glyph")
    message = (
        "cannot infer the section of public class 'Glyph' from its module 'bokeh.models.glyph'; "
        f"add a section with slug 'glyph' or list 'Glyph' under an existing section in {REGISTRY}"
    )
    with pytest.raises(RuntimeError, match=re.escape(message)):
        api_reference._load_public_classes(sections)

def test_stale_registered_class_reports_how_to_fix(api_reference: ModuleType) -> None:
    sections = _with(api_reference._load_sections(), "glyphs", "NotAModel")
    message = f"unknown registered classes: NotAModel; remove them from {REGISTRY}"
    with pytest.raises(RuntimeError, match=re.escape(message)):
        api_reference._load_public_classes(sections)
