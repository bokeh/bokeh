#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a ``Theme`` class for specifying new default values for Bokeh
:class:`~bokeh.model.Model` properties.

'''
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
import yaml

# Bokeh imports
from ..core.has_props import HasProps

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# whenever we cache that there's nothing themed for a class, we
# use this same dict instance, so we don't have a zillion empty
# dicts in our caches.
_empty_dict = dict()

__all__ = (
    'Theme',
)

#-----------------------------------------------------------------------------
# General API
#----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

# Note: in DirectoryHandler and in general we assume this is an
# immutable object, because we share it among sessions and we
# don't monitor it for changes. If you make this mutable by adding
# any kind of setter, you could have to refactor some other code.
class Theme(object):
    ''' Provide new default values for Bokeh models.

    Bokeh Model properties all have some built-in default value. If a property
    has not been explicitly set (e.g. ``m.foo = 10``) then accessing the
    property with return the default value. It may be useful for users to be
    able to specify a different set of default values than the built-in
    default. The ``Theme`` class allows collections of custom default values
    to be easily applied to Bokeh documents.

    The ``Theme`` class can be constructed either from a YAML file or from a
    JSON dict (but not both). Examples of both formats are shown below.

    The plotting API's defaults override some theme properties. Namely:
    `fill_alpha`, `fill_color`, `line_alpha`, `line_color`, `text_alpha` and
    `text_color`. Those properties should therefore be set explicitly when
    using the plotting API.

    Args:
        filename (str, optional) : path to a YAML theme file
        json (str, optional) : a JSON dictionary specifying theme values

    Raises:
        ValueError
            If neither ``filename`` or ``json`` is supplied.

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
                Figure:
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
                'Figure' : {
                    'background_fill_color': '#2F2F2F',
                    'border_fill_color': '#2F2F2F',
                    'outline_line_color': '#444444',
                },
                'Axis': {
                    'axis_line_color': null,
                },
                'Grid': {
                    'grid_line_dash': [6, 4]',
                    'grid_line_alpha': .3,
                },
                'Title': {
                    'text_color': 'white'
                }
            }

    '''
    def __init__(self, filename=None, json=None):
        if (filename is not None) and (json is not None):
            raise ValueError("Theme should be constructed from a file or from json not both")

        if filename is not None:
            with open(filename) as f:
                json = yaml.safe_load(f)
                # empty docs result in None rather than {}, fix it.
                if json is None:
                    json = {}

        if json is None:
            raise ValueError("Theme requires json or a filename to construct")

        self._json = json

        if 'attrs' not in self._json:
            self._json['attrs'] = {}

        if not isinstance(self._json['attrs'], dict):
            raise ValueError("theme problem: attrs field should be a dictionary of class names, not %r" % (self._json['attrs']))

        for key, value in self._json['attrs'].items():
            if not isinstance(value, dict):
                raise ValueError("theme problem: attrs.%s should be a dictionary of properties, not %r" % (key, value))

        self._line_defaults = self._json.get('line_defaults', _empty_dict)
        self._fill_defaults = self._json.get('fill_defaults', _empty_dict)
        self._text_defaults = self._json.get('text_defaults', _empty_dict)

        # mapping from class name to the full set of properties
        # (including those merged in from base classes) for that
        # class.
        self._by_class_cache = {}

    def _add_glyph_defaults(self, cls, props):
        from ..models.glyphs import Glyph
        if issubclass(cls, Glyph):
            if hasattr(cls, "line_alpha"):
                props.update(self._line_defaults)
            if hasattr(cls, "fill_alpha"):
                props.update(self._fill_defaults)
            if hasattr(cls, "text_alpha"):
                props.update(self._text_defaults)

    def _for_class(self, cls):
        if cls.__name__ not in self._by_class_cache:
            attrs = self._json['attrs']
            combined = {}
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

    def apply_to_model(self, model):
        ''' Apply this theme to a model.

        .. warning::
            Typically, don't call this method directly. Instead, set the theme
            on the :class:`~bokeh.document.Document` the model is a part of.

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
