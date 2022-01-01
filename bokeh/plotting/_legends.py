#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
import numpy as np

# Bokeh imports
from ..core.properties import field, value
from ..models import Legend, LegendItem
from ..util.deprecation import deprecated
from ..util.string import nice_join

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'pop_legend_kwarg',
    'update_legend',
)

LEGEND_ARGS = ['legend', 'legend_label', 'legend_field', 'legend_group']

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def pop_legend_kwarg(kwargs):
    result = {attr: kwargs.pop(attr) for attr in LEGEND_ARGS if attr in kwargs}
    if len(result) > 1:
        raise ValueError("Only one of %s may be provided, got: %s" % (nice_join(LEGEND_ARGS), nice_join(result.keys())))
    return result

def update_legend(plot, legend_kwarg, glyph_renderer):
    legend = _get_or_create_legend(plot)
    kwarg, value = list(legend_kwarg.items())[0]

    _LEGEND_KWARG_HANDLERS[kwarg](value, legend, glyph_renderer)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _find_legend_item(label, legend):
    for item in legend.items:
        if item.label == label:
            return item
    return None

def _get_or_create_legend(plot):
    legends = plot.select(type=Legend)
    if not legends:
        legend = Legend()
        plot.add_layout(legend)
        return legend
    if len(legends) == 1:
        return legends[0]
    raise RuntimeError("Plot %s configured with more than one legend renderer, cannot use legend_* convenience arguments" % plot)

def _handle_legend_deprecated(label, legend, glyph_renderer):
    deprecated("'legend' keyword is deprecated, use explicit 'legend_label', 'legend_field', or 'legend_group' keywords instead")

    if not isinstance(label, (str, dict)):
        raise ValueError("Bad 'legend' parameter value: %s" % label)

    if isinstance(label, dict):
        if "field" in label and len(label) == 1:
            label = label['field']
            _handle_legend_field(label, legend, glyph_renderer)
        elif "value" in label and len(label) == 1:
            label = label['value']
            _handle_legend_label(label, legend, glyph_renderer)

        else:
            raise ValueError("Bad 'legend' parameter value: %s" % label)
    else:
        source = glyph_renderer.data_source
        if source is not None and hasattr(source, 'column_names') and label in source.column_names:
            _handle_legend_field(label, legend, glyph_renderer)
        else:
            _handle_legend_label(label, legend, glyph_renderer)

def _handle_legend_field(label, legend, glyph_renderer):
    if not isinstance(label, str):
        raise ValueError("legend_field value must be a string")
    label = field(label)
    item = _find_legend_item(label, legend)
    if item:
        item.renderers.append(glyph_renderer)
    else:
        new_item = LegendItem(label=label, renderers=[glyph_renderer])
        legend.items.append(new_item)

def _handle_legend_group(label, legend, glyph_renderer):
    if not isinstance(label, str):
        raise ValueError("legend_group value must be a string")

    source = glyph_renderer.data_source
    if source is None:
        raise ValueError("Cannot use 'legend_group' on a glyph without a data source already configured")
    if not (hasattr(source, 'column_names') and label in source.column_names):
        raise ValueError("Column to be grouped does not exist in glyph data source")

    column = source.data[label]
    vals, inds = np.unique(column, return_index=1)
    for val, ind in zip(vals, inds):
        label = value(str(val))
        new_item = LegendItem(label=label, renderers=[glyph_renderer], index=ind)
        legend.items.append(new_item)

def _handle_legend_label(label, legend, glyph_renderer):
    if not isinstance(label, str):
        raise ValueError("legend_label value must be a string")
    label = value(label)
    item = _find_legend_item(label, legend)
    if item:
        item.renderers.append(glyph_renderer)
    else:
        new_item = LegendItem(label=label, renderers=[glyph_renderer])
        legend.items.append(new_item)

_LEGEND_KWARG_HANDLERS = {
    'legend'       : _handle_legend_deprecated,
    'legend_label' : _handle_legend_label,
    'legend_field' : _handle_legend_field,
    'legend_group' : _handle_legend_group,
}

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
