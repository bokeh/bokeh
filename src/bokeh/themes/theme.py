#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a ``Theme`` class for specifying new default values for Bokeh
|Model| properties.

'''
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any, Literal, TypeAlias, overload

# External imports
import yaml
from lark import (
    Lark,
    Token,
    Transformer,
    UnexpectedCharacters,
    UnexpectedEOF,
    UnexpectedToken,
)

# Bokeh imports
from ..core.has_props import HasProps

if TYPE_CHECKING:
    from ..core.types import PathLike
    from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# whenever we cache that there's nothing themed for a class, we
# use this same dict instance, so we don't have a zillion empty
# dicts in our caches.
_empty_dict: dict[str, Any] = {}

__all__ = (
    'Theme',
)

@dataclass
class Selector:

    type: str
    name: str | None
    tags: list[str]
    props: list[tuple[str, Any]]

    def __str__(self) -> str:
        type = self.type
        name = f"#{self.name}" if self.name is not None else ""
        tags = "".join([f".{tag}" for tag in self.tags])
        props = "".join([f"[{name}={value!r}]" for [name, value] in self.props])
        return f"{type}{name}{tags}{props}"

@dataclass
class Combinator:

    type: Literal["descendant", "child", "adjacent_sibling", "general_sibling"]
    left: Selector
    right: Selector

    def __str__(self) -> str:
        match self.type:
            case "descendant":
                op = " "
            case "child":
                op = " > "
            case "adjacent_sibling":
                op = " + "
            case "general_sibling":
                op = " ~ "
        return f"{self.left}{op}{self.right}"

@dataclass
class Grouping:

    selectors: list[Selector | Combinator]

    def __str__(self) -> str:
        return ", ".join([f"{selector}" for selector in self.selectors])

SelectorLike: TypeAlias = Selector | Combinator | Grouping

class TreeToSelector(Transformer):

    def TYPE(self, type: Token) -> str:
        return type.value

    def NAME_SELECTOR(self, name: Token) -> str:
        return name.value[1:]

    def TAG_SELECTOR(self, tag: Token) -> str:
        return tag.value[1:]

    def tags(self, tags: list[str]) -> list[str]:
        return tags

    def prop_selector(self, args: tuple[Token, Token]):
        name, value = args
        return (name.value, value.value)

    def props(self, props: list[tuple[str, Any]]) -> list[tuple[str, Any]]:
        return props

    def selector(self, args: tuple[str, str | None, list[str], list[tuple[str, Any]]]):
        type, name, tags, props = args
        return Selector(type, name, tags, props)

    def descendant_selector(self, args: tuple[Selector, Selector]):
        left, right = args
        return Combinator("descendant", left, right)

    def child_selector(self, args: tuple[Selector, Selector]):
        left, right = args
        return Combinator("child", left, right)

    def adjacent_sibling_selector(self, args: tuple[Selector, Selector]):
        left, right = args
        return Combinator("adjacent_sibling", left, right)

    def general_sibling_selector(self, args: tuple[Selector, Selector]):
        left, right = args
        return Combinator("general_sibling", left, right)

    def grouping_selector(self, selectors: list[Selector | Combinator]):
        return Grouping(selectors)

with open(Path(__file__).parent / "selector.lark") as f:
    _selector_parser = Lark(f, parser="lalr", maybe_placeholders=True, transformer=TreeToSelector(visit_tokens=True))

def parse_selector(selector: str) -> SelectorLike | None:
    try:
        return _selector_parser.parse(selector)
    except (UnexpectedCharacters, UnexpectedEOF, UnexpectedToken):
        return None

#-----------------------------------------------------------------------------
# General API
#----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@dataclass
class ThemeSpec:
    attrs: dict[SelectorLike, dict[str, Any]]
    vars: dict[str, Any]

# Note: in DirectoryHandler and in general we assume this is an
# immutable object, because we share it among sessions and we
# don't monitor it for changes. If you make this mutable by adding
# any kind of setter, you could have to refactor some other code.
class Theme:
    ''' Provide new default values for Bokeh models.

    Bokeh Model properties all have some built-in default value. If a property
    has not been explicitly set (e.g. ``m.foo = 10``), accessing the
    property will return the default value. It may be useful for users to be
    able to specify a different set of default values than the built-in
    default. The ``Theme`` class allows collections of custom default values
    to be easily applied to Bokeh documents.

    The ``Theme`` class can be constructed either from a YAML file or from a
    JSON dict (but not both). Examples of both formats are shown below.

    The plotting API defaults override some theme properties. Namely:
    `fill_alpha`, `fill_color`, `line_alpha`, `line_color`, `text_alpha` and
    `text_color`. Those properties should therefore be set explicitly when
    using the plotting API.

    Args:
        filename (str, optional) : path to a YAML theme file
        json (str, optional) : a JSON dictionary specifying theme values

    Raises:
        ValueError
            If neither ``filename`` nor ``json`` is supplied.

    Examples:

        Themes are specified by providing a top-level key ``attrs`` which
        has blocks for Model types to be themed. Each block has keys and
        values that specify the new property defaults for that type.

        Take note of the fact that YAML interprets the value `None` as
        a string, which is not usually what you want. To give `None` as a
        value in YAML, use `!!null`. To give 'None' as a value in json,
        use `null`.

        Here is an example theme in YAML format that sets various visual
        properties for all figures, grids, and titles:

        .. code-block:: yaml

            attrs:
                Plot:
                    background_fill_color: '#2F2F2F'
                    border_fill_color: '#2F2F2F'
                    outline_line_color: '#444444'
                Axis:
                    axis_line_color: !!null
                Grid:
                    grid_line_dash: [6, 4]
                    grid_line_alpha: .3
                Title:
                    text_color: "white"

        Here is the same theme, in JSON format:

        .. code-block:: python

            {
                'attrs' : {
                    'Plot': {
                        'background_fill_color': '#2F2F2F',
                        'border_fill_color': '#2F2F2F',
                        'outline_line_color': '#444444',
                    },
                    'Axis': {
                        'axis_line_color': None,
                    },
                    'Grid': {
                        'grid_line_dash': [6, 4],
                        'grid_line_alpha': .3,
                    },
                    'Title': {
                        'text_color': 'white'
                    }
                }
            }

    '''

    _by_class_cache: dict[str, dict[str, Any]]

    _line_defaults: dict[str, Any]
    _fill_defaults: dict[str, Any]
    _text_defaults: dict[str, Any]

    _json: dict[str, Any]

    @overload
    def __init__(self, filename: PathLike) -> None: ...
    @overload
    def __init__(self, json: dict[str, Any]) -> None: ...

    def __init__(self, filename: PathLike | None = None, json: dict[str, Any] | None = None) -> None:
        if (filename is not None) and (json is not None):
            raise ValueError("Theme should be constructed from a file or from json not both")

        if filename is not None:
            with open(filename, "rb") as f:
                json = yaml.safe_load(f)
                # empty docs result in None rather than {}, fix it.
                if json is None:
                    json = {}

        if json is None:
            raise ValueError("Theme requires json or a filename to construct")

        #self._process_theme(json)

        self._json = json

        if 'attrs' not in self._json:
            self._json['attrs'] = {}

        if not isinstance(self._json['attrs'], dict):
            raise ValueError(f"theme problem: attrs field should be a dictionary of class names, not {self._json['attrs']!r}")

        for key, value in self._json['attrs'].items():
            if not isinstance(value, dict):
                raise ValueError(f"theme problem: attrs.{key} should be a dictionary of properties, not {value!r}")

        self._line_defaults = self._json.get('line_defaults', _empty_dict)
        self._fill_defaults = self._json.get('fill_defaults', _empty_dict)
        self._text_defaults = self._json.get('text_defaults', _empty_dict)

        # mapping from class name to the full set of properties
        # (including those merged in from base classes) for that
        # class.
        self._by_class_cache = {}

    @classmethod
    def from_file(cls, filename: PathLike) -> Theme:
        """ """
        with open(filename, "rb") as f:
            json = yaml.safe_load(f)
            # empty docs result in None rather than {}, fix it.
            if json is None:
                json = {}

        return cls.from_json(json=json)

    @classmethod
    def from_json(cls, filename: str | dict[str, Any]) -> Theme:
        """ """
        return Theme()

    @classmethod
    def _process_theme(cls, json: dict[str, Any]) -> ThemeSpec:
        attrs = json.get("attrs", {})
        vars = json.get("vars", {})

        if not isinstance(attrs, dict):
            log.warning("expected theme 'attrs' field to be a dictionary of ...")

        if not isinstance(vars, dict):
            log.warning("expected theme 'vars' field be a dictionary of ...")

        resolved_attrs: dict[SelectorLike, dict[str, Any]] = {}
        resolved_vars: dict[str, Any] = {}

        for selector, props in attrs:
            if not isinstance(selector, str):
                log.warning("expected a string selector; ignoring")
                continue
            if not isinstance(props, dict):
                log.warning("expected a dict of properties; ignoring")
                continue

            expr = parse_selector(selector)
            if expr is None:
                log.warning(f"invalid selector {selector!r}; ignoring")
                continue

            for attr, value in props:
                if not isinstance(attr, str):
                    log.warning("expected a property name; ignoring")

            resolved_attrs[expr] = props

        return ThemeSpec(resolved_attrs, resolved_vars)

    def _add_glyph_defaults(self, cls: type[HasProps], props: dict[str, Any]) -> None:
        from ..models.glyph import Glyph
        if issubclass(cls, Glyph):
            if hasattr(cls, "line_alpha"):
                props.update(self._line_defaults)
            if hasattr(cls, "fill_alpha"):
                props.update(self._fill_defaults)
            if hasattr(cls, "text_alpha"):
                props.update(self._text_defaults)

    def _for_class(self, cls: type[Model]) -> dict[str, Any]:
        if cls.__name__ not in self._by_class_cache:
            attrs = self._json['attrs']
            combined: dict[str, Any] = {}
            # we go in reverse order so that subclass props override base class
            for base in cls.__mro__[-2::-1]:
                if not issubclass(base, HasProps):
                    continue
                self._add_glyph_defaults(base, combined)
                combined.update(attrs.get(base.__name__, _empty_dict))
            if len(combined) == 0:
                combined = _empty_dict
            self._by_class_cache[cls.__name__] = combined
        return self._by_class_cache[cls.__name__]

    def apply_to_model(self, model: Model) -> None:
        ''' Apply this theme to a model.

        .. warning::
            Typically, don't call this method directly. Instead, set the theme
            on the |Document| the model is a part of.

        '''
        model.apply_theme(self._for_class(model.__class__))

        # a little paranoia because it would be Bad(tm) to mess
        # this up... would be nicer if python had a way to freeze
        # the dict.
        if len(_empty_dict) > 0:
            raise RuntimeError("Somebody put stuff in _empty_dict")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#----------------------------------------------------------------------------
