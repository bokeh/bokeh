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

# Standard library imports
from inspect import Parameter, signature
from unittest import mock

# Bokeh imports
from bokeh.models import DataView, Marker
from bokeh.plotting import figure
from bokeh.plotting._docstring import generate_docstring
from bokeh.plotting._renderer import RENDERER_ARGS, GlyphRenderer

# Module under test
import bokeh.plotting._decorators as bpd # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


# TODO: ideally, the list of arguments should be received directly from
# GlyphRenderer, but such case requires a system that would be able to generate
# acceptable values for parameters
_renderer_args_values = dict(
    name=[None, "", "test name"],
    coordinates=[None, None],
    x_range_name=[None, "", "x range"],
    y_range_name=[None, "", "y range"],
    level=[None, "overlay"],
    view=[None, DataView()],
    visible=[None, False, True],
    muted=[None, False, True],
)
@pytest.mark.parametrize('arg,values', [(arg, _renderer_args_values[arg]) for arg in RENDERER_ARGS])
def test__glyph_receives_renderer_arg(arg, values) -> None:
    for value in values:
        with mock.patch('bokeh.plotting._renderer.GlyphRenderer', autospec=True) as gr_mock:
            def foo(**kw): pass
            fn = bpd.glyph_method(Marker)(foo)
            fn(figure(), x=0, y=0, **{arg: value})
            _, kwargs = gr_mock.call_args
            assert arg in kwargs and kwargs[arg] == value


def test__glyph_method_keeps_metadata() -> None:
    def foo(**kw) -> GlyphRenderer: pass
    glyphclass = Marker
    fn = bpd.glyph_method(glyphclass)(foo)
    expected_doc = generate_docstring(glyphclass, glyphclass.parameters(), foo.__doc__)
    assert fn.__name__ == foo.__name__
    assert fn.__doc__ == expected_doc
    assert signature(fn).return_annotation == signature(foo).return_annotation


def test__glyph_method_adapts_positional_source_data() -> None:
    def foo(**kw) -> GlyphRenderer: pass
    records = object()
    source = object()
    adapter = mock.Mock(return_value=source)
    renderer = object()
    plot = figure()

    with mock.patch.object(bpd, "create_renderer", return_value=renderer) as create_renderer:
        fn = bpd.glyph_method(Marker, source_arg="records", source_adapter=adapter)(foo)
        result = fn(plot, records)

    assert result is renderer
    adapter.assert_called_once_with(records)
    create_renderer.assert_called_once_with(Marker, plot, source=source, _source_is_internal=True)
    assert "records" in signature(fn).parameters


def test__glyph_method_constructs_default_source() -> None:
    def foo(**kw) -> GlyphRenderer: pass
    source = object()
    renderer = object()

    with mock.patch.object(bpd, "create_renderer", return_value=renderer) as create_renderer:
        fn = bpd.glyph_method(
            Marker,
            source_arg="records",
            source_adapter=lambda value: value,
            source_default=lambda: source,
        )(foo)
        result = fn(figure())

    assert result is renderer
    create_renderer.assert_called_once_with(Marker, mock.ANY, source=source, _source_is_internal=True)


def test__glyph_method_adapts_source_fields() -> None:
    def foo(**kw) -> GlyphRenderer: pass
    source = object()
    adapter = mock.Mock(return_value=source)
    renderer = object()

    with mock.patch.object(bpd, "create_renderer", return_value=renderer) as create_renderer:
        fn = bpd.glyph_method(
            Marker,
            source_fields=("u", "v"),
            source_adapter=adapter,
        )(foo)
        result = fn(figure(), u=[1, 2], v=[3, 4])

    assert result is renderer
    adapter.assert_called_once_with(u=[1, 2], v=[3, 4])
    create_renderer.assert_called_once_with(Marker, mock.ANY, source=source, _source_is_internal=True)
    assert signature(fn).parameters["u"].kind.name == "KEYWORD_ONLY"
    assert signature(fn).parameters["v"].kind.name == "KEYWORD_ONLY"


def test__glyph_method_requires_all_source_fields() -> None:
    def foo(**kw) -> GlyphRenderer: pass
    fn = bpd.glyph_method(
        Marker,
        source_fields=("u", "v"),
        source_adapter=lambda **values: values,
    )(foo)

    with pytest.raises(ValueError, match=r"provided together.*missing: v"):
        fn(figure(), u=[1, 2])

    with pytest.raises(ValueError, match="either u, v data or a source"):
        fn(figure(), u=[1, 2], v=[3, 4], source=object())


def test__glyph_method_excludes_parameters() -> None:
    def foo(**kw) -> GlyphRenderer: pass
    fn = bpd.glyph_method(Marker, exclude=Marker._args)(foo)

    assert "x" not in signature(fn).parameters
    assert "y" not in signature(fn).parameters
    with pytest.raises(TypeError, match="does not accept x"):
        fn(figure(), x=[1])
    with pytest.raises(TypeError, match="takes 0 positional argument"):
        fn(figure(), [1])


def test__glyph_method_rejects_conflicting_source_data() -> None:
    def foo(**kw) -> GlyphRenderer: pass
    fn = bpd.glyph_method(Marker, source_arg="records", source_adapter=lambda value: value)(foo)

    with pytest.raises(TypeError, match="multiple values"):
        fn(figure(), object(), records=object())

    with pytest.raises(ValueError, match="either records data or a source"):
        fn(figure(), object(), source=object())


def test__marker_method_keeps_metadata() -> None:
    def foo(**kw) -> GlyphRenderer: pass
    fn = bpd.marker_method()(foo)
    expected_doc = generate_docstring(Marker, Marker.parameters(), foo.__doc__)
    assert fn.__name__ == foo.__name__
    assert fn.__doc__ == expected_doc
    assert signature(fn).return_annotation == signature(foo).return_annotation


@pytest.mark.parametrize("doc", [
    "First paragraph.\n\nSecond paragraph.",
    "\n    First paragraph.\n\n    Second paragraph.\n",
])
def test_glyph_docstring_parameter_indentation(doc: str) -> None:
    param = Parameter("value", kind=Parameter.KEYWORD_ONLY)
    generated = generate_docstring(Marker, [(param, "str", doc)], None)

    assert """\
Keyword args:
    value (str):
        First paragraph.

        Second paragraph.
""" in generated


#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
