""" Defines the Session type
"""
from __future__ import absolute_import

from .  import _glyph_functions
from .objects import Instance, List
from .plot_object import PlotObject
from .plotting_helpers import (get_default_color, get_default_alpha,
        _glyph_doc, _match_data_params, _update_plot_data_ranges,
        _materialize_colors_and_alpha, _get_legend, _make_legend,
        _get_select_tool, _new_xy_plot, _handle_1d_data_args, _list_attr_splat)

import logging
import warnings

logger = logging.getLogger(__file__)

class Session(object):

    plots = List(Instance(PlotObject, has_ref=True), has_ref=True)

    def __init__(self):
        self._current_plot = None
        self._next_figure_kwargs = dict()
        self._hold = False

    def __enter__(self):
        return self

    def __exit__(self, e_ty, e_val, e_tb):
        pass

    def hold(self, value=True):
        self._hold = value

    def figure(self, **kwargs):
        self._current_plot = None
        self._next_figure_kwargs = kwargs

    def curplot(self):
        return self._current_plot;

    annular_wedge     = _glyph_functions.annular_wedge
    annulus           = _glyph_functions.annulus
    arc               = _glyph_functions.arc
    asterisk          = _glyph_functions.asterisk
    bezier            = _glyph_functions.bezier
    circle            = _glyph_functions.circle
    circle_cross      = _glyph_functions.circle_cross
    circle_x          = _glyph_functions.circle_x
    cross             = _glyph_functions.cross
    diamond           = _glyph_functions.diamond
    diamond_cross     = _glyph_functions.diamond_cross
    image             = _glyph_functions.image
    image_rgba        = _glyph_functions.image_rgba
    inverted_triangle = _glyph_functions.inverted_triangle
    line              = _glyph_functions.line
    multi_line        = _glyph_functions.multi_line
    oval              = _glyph_functions.oval
    patch             = _glyph_functions.patch
    patches           = _glyph_functions.patches
    quad              = _glyph_functions.quad
    quadratic         = _glyph_functions.quadratic
    ray               = _glyph_functions.ray
    rect              = _glyph_functions.rect
    segment           = _glyph_functions.segment
    square            = _glyph_functions.square
    square_cross      = _glyph_functions.square_cross
    square_x          = _glyph_functions.square_x
    text              = _glyph_functions.text
    triangle          = _glyph_functions.triangle
    wedge             = _glyph_functions.wedge
    x                 = _glyph_functions.x

    def add(self, *objects):
        for obj in objects:
            if isinstance(obj, PlotObject) and obj not in self.plots:
                self.plots.append(obj)

    def _get_plot(self, kwargs):
        plot = kwargs.pop("plot", None)
        if not plot:
            if self._hold and self._current_plot:
                plot = self._current_plot
            else:
                plot_kwargs = self._next_figure_kwargs
                self._next_figure_kwargs = dict()
                plot_kwargs.update(kwargs)
                plot = _new_xy_plot(**plot_kwargs)
        self._current_plot = plot
        return plot
