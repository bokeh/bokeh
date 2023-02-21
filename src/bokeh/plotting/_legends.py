#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from ..util.strings import nice_join

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
        raise ValueError(f"Only one of {nice_join(LEGEND_ARGS)} may be provided, got: {nice_join(result.keys())}")
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
    # Using the simpler plot.select(type=Legend) to find the existing legend
    # here is very inefficient on already populated plots, therefore we do it
    # like this. TODO: This will need to be reworked when introducing nested
    # layouts!
    panels = plot.above + plot.below + plot.left + plot.right + plot.center
    legends = [obj for obj in panels if isinstance(obj, Legend)]

    if not legends:
        legend = Legend()
        plot.add_layout(legend)
        return legend
    if len(legends) == 1:
        return legends[0]
    raise RuntimeError("Plot %s configured with more than one legend renderer, cannot use legend_* convenience arguments" % plot)

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
    'legend_label' : _handle_legend_label,
    'legend_field' : _handle_legend_field,
    'legend_group' : _handle_legend_group,
}

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
