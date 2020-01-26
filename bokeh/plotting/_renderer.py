#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys
from collections.abc import Iterable

# External imports
import numpy as np

# Bokeh imports
from ..core.properties import ColorSpec
from ..models import ColumnarDataSource, ColumnDataSource, GlyphRenderer
from ..util.dependencies import import_optional
from ..util.string import nice_join
from ._legends import pop_legend_kwarg, update_legend

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

pd = import_optional('pandas')

__all__ = (
    'create_renderer',
    'make_glyph',
    'pop_visuals',
)

RENDERER_ARGS = ['name', 'x_range_name', 'y_range_name',
                 'level', 'view', 'visible', 'muted']

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def get_default_color(plot=None):
    colors = [
        "#1f77b4",
        "#ff7f0e", "#ffbb78",
        "#2ca02c", "#98df8a",
        "#d62728", "#ff9896",
        "#9467bd", "#c5b0d5",
        "#8c564b", "#c49c94",
        "#e377c2", "#f7b6d2",
        "#7f7f7f",
        "#bcbd22", "#dbdb8d",
        "#17becf", "#9edae5"
    ]
    if plot:
        renderers = plot.renderers
        renderers = [x for x in renderers if x.__view_model__ == "GlyphRenderer"]
        num_renderers = len(renderers)
        return colors[num_renderers]
    else:
        return colors[0]

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


def create_renderer(glyphclass, plot, **kwargs):
    # convert data source, if necessary
    is_user_source = _convert_data_source(kwargs)

    # save off legend kwargs before we get going
    legend_kwarg = pop_legend_kwarg(kwargs)

    # need to check if user source is present before pop_renderer_args
    renderer_kws = _pop_renderer_args(kwargs)
    source = renderer_kws['data_source']

    # handle the main glyph, need to process literals
    glyph_visuals = pop_visuals(glyphclass, kwargs)
    incompatible_literal_spec_values = []
    incompatible_literal_spec_values += _process_sequence_literals(glyphclass, kwargs, source, is_user_source)
    incompatible_literal_spec_values += _process_sequence_literals(glyphclass, glyph_visuals, source, is_user_source)
    if incompatible_literal_spec_values:
        raise RuntimeError(_GLYPH_SOURCE_MSG % nice_join(incompatible_literal_spec_values, conjuction="and"))

    # handle the nonselection glyph, we always set one
    nonselection_visuals = pop_visuals(glyphclass, kwargs, prefix='nonselection_', defaults=glyph_visuals, override_defaults={'alpha':0.1})

    # handle the selection glyph, if any properties were given
    if any(x.startswith('selection_') for x in kwargs):
        selection_visuals = pop_visuals(glyphclass, kwargs, prefix='selection_', defaults=glyph_visuals)
    else:
        selection_visuals = None

    # handle the hover glyph, if any properties were given
    if any(x.startswith('hover_') for x in kwargs):
        hover_visuals = pop_visuals(glyphclass, kwargs, prefix='hover_', defaults=glyph_visuals)
    else:
        hover_visuals = None

    # handle the mute glyph, if any properties were given
    if any(x.startswith('muted_') for x in kwargs):
        muted_visuals = pop_visuals(glyphclass, kwargs, prefix='muted_', defaults=glyph_visuals)
    else:
        muted_visuals = None

    glyph_renderer = GlyphRenderer(
        glyph=make_glyph(glyphclass, kwargs, glyph_visuals),
        nonselection_glyph=make_glyph(glyphclass, kwargs, nonselection_visuals),
        selection_glyph=make_glyph(glyphclass, kwargs, selection_visuals),
        hover_glyph=make_glyph(glyphclass, kwargs, hover_visuals),
        muted_glyph=make_glyph(glyphclass, kwargs, muted_visuals),
        **renderer_kws)

    if legend_kwarg:
        update_legend(plot, legend_kwarg, glyph_renderer)

    plot.renderers.append(glyph_renderer)

    return glyph_renderer

def make_glyph(glyphclass, kws, extra):
    if extra is None:
        return None
    kws = kws.copy()
    kws.update(extra)
    return glyphclass(**kws)

def pop_visuals(glyphclass, props, prefix="", defaults={}, override_defaults={}):
    """
    Applies basic cascading logic to deduce properties for a glyph.

    Args:
        glyphclass :
            the type of glyph being handled

        props (dict) :
            Maps properties and prefixed properties to their values.
            Keys in `props` matching `glyphclass` visual properties (those of
            'line_', 'fill_' or 'text_') with added `prefix` will get popped,
            other keys will be ignored.
            Keys take the form '[{prefix}][{feature}_]{trait}'. Only {feature}
              must not contain underscores.
            Keys of the form '{prefix}{trait}' work as lower precedence aliases
              for {trait} for all {features}, as long as the glyph has no
              property called {trait}. I.e. this won't apply to "width" in a
              `rect` glyph.
            Ex: {'fill_color': 'blue', 'selection_line_width': 0.5}

        prefix (str) :
            Prefix used when accessing `props`. Ex: 'selection_'

        override_defaults (dict) :
            Explicitly provided fallback based on '{trait}', in case property
            not set in `props`.
            Ex. 'width' here may be used for 'selection_line_width'.

        defaults (dict) :
            Property fallback, in case prefixed property not in `props` or
            `override_defaults`.
            Ex. 'line_width' here may be used for 'selection_line_width'.

    Returns:
        result (dict) :
            Resulting properties for the instance (no prefixes).

    Notes:
        Feature trait 'text_color', as well as traits 'color' and 'alpha', have
        ultimate defaults in case those can't be deduced.
    """
    def split_feature_trait(ft):
        """Feature is up to first '_'. Ex. 'line_color' => ['line', 'color']"""
        ft = ft.split('_', 1)
        return ft if len(ft)==2 else ft+[None]

    def is_visual(ft):
        """Whether a feature trait name is visual"""
        feature, trait = split_feature_trait(ft)
        return feature in ('line', 'fill', 'text', 'global') and trait is not None

    defaults = defaults.copy()
    defaults.setdefault('text_color', 'black')

    trait_defaults = {}
    trait_defaults.setdefault('color', get_default_color())
    trait_defaults.setdefault('alpha', 1.0)

    result, traits = dict(), set()
    glyphprops = glyphclass.properties()
    for pname in filter(is_visual, glyphprops):
        _, trait = split_feature_trait(pname)

        # e.g. "line_color", "selection_fill_alpha"
        if prefix+pname in props:
            result[pname] = props.pop(prefix+pname)

        # e.g. "nonselection_alpha"
        elif trait not in glyphprops and prefix+trait in props:
            result[pname] = props[prefix+trait]

        # e.g. an alpha to use for nonselection if none is provided
        elif trait in override_defaults:
            result[pname] = override_defaults[trait]

        # e.g use values off the main glyph
        elif pname in defaults:
            result[pname] = defaults[pname]

        # e.g. not specificed anywhere else
        elif trait in trait_defaults:
            result[pname] = trait_defaults[trait]

        if trait not in glyphprops:
            traits.add(trait)
    for trait in traits:
        props.pop(prefix+trait, None)

    return result

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _convert_data_source(kwargs):
    is_user_source = kwargs.get('source', None) is not None
    if is_user_source:
        source = kwargs['source']
        if not isinstance(source, ColumnarDataSource):
            try:
                # try converting the source to ColumnDataSource
                source = ColumnDataSource(source)
            except ValueError as err:
                msg = "Failed to auto-convert {curr_type} to ColumnDataSource.\n Original error: {err}".format(
                    curr_type=str(type(source)),
                    err=err.message
                )
                raise ValueError(msg).with_traceback(sys.exc_info()[2])

            # update kwargs so that others can use the new source
            kwargs['source'] = source

    return is_user_source

def _pop_renderer_args(kwargs):
    result = {attr: kwargs.pop(attr)
              for attr in RENDERER_ARGS
              if attr in kwargs}
    result['data_source'] = kwargs.pop('source', ColumnDataSource())
    return result

def _process_sequence_literals(glyphclass, kwargs, source, is_user_source):
    incompatible_literal_spec_values = []
    dataspecs = glyphclass.dataspecs_with_props()
    for var, val in kwargs.items():

        # ignore things that are not iterable
        if not isinstance(val, Iterable):
            continue

        # pass dicts (i.e., values or fields) on as-is
        if isinstance(val, dict):
            continue

        # let any non-dataspecs do their own validation (e.g., line_dash properties)
        if var not in dataspecs:
            continue

        # strings sequences are handled by the dataspec as-is
        if isinstance(val, str):
            continue

        # similarly colorspecs handle color tuple sequences as-is
        if (isinstance(dataspecs[var].property, ColorSpec) and isinstance(val, tuple) and len(val) in (3, 4) and all(isinstance(v, (float, int)) for v in val)):
            continue

        if isinstance(val, np.ndarray) and val.ndim != 1:
            raise RuntimeError("Columns need to be 1D (%s is not)" % var)

        if is_user_source:
            incompatible_literal_spec_values.append(var)
        else:
            source.add(val, name=var)
            kwargs[var] = var

    return incompatible_literal_spec_values

_GLYPH_SOURCE_MSG = """

Expected %s to reference fields in the supplied data source.

When a 'source' argument is passed to a glyph method, values that are sequences
(like lists or arrays) must come from references to data columns in the source.

For instance, as an example:

    source = ColumnDataSource(data=dict(x=a_list, y=an_array))

    p.circle(x='x', y='y', source=source, ...) # pass column names and a source

Alternatively, *all* data sequences may be provided as literals as long as a
source is *not* provided:

    p.circle(x=a_list, y=an_array, ...)  # pass actual sequences and no source

"""

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
