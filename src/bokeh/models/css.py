#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Various abstractions over the CSS object model.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.has_props import abstract
from ..core.properties import Nullable, Required, String
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "GlobalImportedStyleSheet",
    "GlobalInlineStyleSheet",
    "ImportedStyleSheet",
    "InlineStyleSheet",
    "Styles",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class StyleSheet(Model):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class InlineStyleSheet(StyleSheet):
    """ Inline stylesheet equivalent to ``<style type="text/css">${css}</style>``.

    .. note::
        Depending on the context, this stylesheet will be appended either to
        the parent shadow root, if used in a component, or otherwise to
        the ``<head>`` element. If you want to append globally regardless of
        the context, use ``GlobalInlineStyleSheet`` instead.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    css = Required(String, help="""
    The contents of this stylesheet.
    """)

class ImportedStyleSheet(StyleSheet):
    """ Imported stylesheet equivalent to ``<link rel="stylesheet" href="${url}">``.

    .. note::
        Depending on the context, this stylesheet will be appended either to
        the parent shadow root, if used in a component, or otherwise to
        the ``<head>`` element. If you want to append globally regardless of
        the context, use ``GlobalImportedStyleSheet`` instead.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    url = Required(String, help="""
    The location of an external stylesheet.
    """)

class GlobalInlineStyleSheet(InlineStyleSheet):
    """ An inline stylesheet that's appended to the ``<head>`` element.

    .. note::
        A stylesheet will be appended only once, regardless of how
        many times it's being used in other models.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class GlobalImportedStyleSheet(ImportedStyleSheet):
    """ An imported stylesheet that's appended to the ``<head>`` element.

    .. note::
        A stylesheet will be appended only once, regardless of how
        many times it's being used in other models.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class Styles(Model):
    """ Allows to configure style attribute of DOM elements. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    align_content = Nullable(String)
    align_items = Nullable(String)
    align_self = Nullable(String)
    alignment_baseline = Nullable(String)
    all = Nullable(String)
    animation = Nullable(String)
    animation_delay = Nullable(String)
    animation_direction = Nullable(String)
    animation_duration = Nullable(String)
    animation_fill_mode = Nullable(String)
    animation_iteration_count = Nullable(String)
    animation_name = Nullable(String)
    animation_play_state = Nullable(String)
    animation_timing_function = Nullable(String)
    aspect_ratio = Nullable(String)
    backface_visibility = Nullable(String)
    background = Nullable(String)
    background_attachment = Nullable(String)
    background_clip = Nullable(String)
    background_color = Nullable(String)
    background_image = Nullable(String)
    background_origin = Nullable(String)
    background_position = Nullable(String)
    background_position_x = Nullable(String)
    background_position_y = Nullable(String)
    background_repeat = Nullable(String)
    background_size = Nullable(String)
    baseline_shift = Nullable(String)
    block_size = Nullable(String)
    border = Nullable(String)
    border_block_end = Nullable(String)
    border_block_end_color = Nullable(String)
    border_block_end_style = Nullable(String)
    border_block_end_width = Nullable(String)
    border_block_start = Nullable(String)
    border_block_start_color = Nullable(String)
    border_block_start_style = Nullable(String)
    border_block_start_width = Nullable(String)
    border_bottom = Nullable(String)
    border_bottom_color = Nullable(String)
    border_bottom_left_radius = Nullable(String)
    border_bottom_right_radius = Nullable(String)
    border_bottom_style = Nullable(String)
    border_bottom_width = Nullable(String)
    border_collapse = Nullable(String)
    border_color = Nullable(String)
    border_image = Nullable(String)
    border_image_outset = Nullable(String)
    border_image_repeat = Nullable(String)
    border_image_slice = Nullable(String)
    border_image_source = Nullable(String)
    border_image_width = Nullable(String)
    border_inline_end = Nullable(String)
    border_inline_end_color = Nullable(String)
    border_inline_end_style = Nullable(String)
    border_inline_end_width = Nullable(String)
    border_inline_start = Nullable(String)
    border_inline_start_color = Nullable(String)
    border_inline_start_style = Nullable(String)
    border_inline_start_width = Nullable(String)
    border_left = Nullable(String)
    border_left_color = Nullable(String)
    border_left_style = Nullable(String)
    border_left_width = Nullable(String)
    border_radius = Nullable(String)
    border_right = Nullable(String)
    border_right_color = Nullable(String)
    border_right_style = Nullable(String)
    border_right_width = Nullable(String)
    border_spacing = Nullable(String)
    border_style = Nullable(String)
    border_top = Nullable(String)
    border_top_color = Nullable(String)
    border_top_left_radius = Nullable(String)
    border_top_right_radius = Nullable(String)
    border_top_style = Nullable(String)
    border_top_width = Nullable(String)
    border_width = Nullable(String)
    bottom = Nullable(String)
    box_shadow = Nullable(String)
    box_sizing = Nullable(String)
    break_after = Nullable(String)
    break_before = Nullable(String)
    break_inside = Nullable(String)
    caption_side = Nullable(String)
    caret_color = Nullable(String)
    clear = Nullable(String)
    clip = Nullable(String)
    clip_path = Nullable(String)
    clip_rule = Nullable(String)
    color = Nullable(String)
    color_interpolation = Nullable(String)
    color_interpolation_filters = Nullable(String)
    column_count = Nullable(String)
    column_fill = Nullable(String)
    column_gap = Nullable(String)
    column_rule = Nullable(String)
    column_rule_color = Nullable(String)
    column_rule_style = Nullable(String)
    column_rule_width = Nullable(String)
    column_span = Nullable(String)
    column_width = Nullable(String)
    columns = Nullable(String)
    content = Nullable(String)
    counter_increment = Nullable(String)
    counter_reset = Nullable(String)
    cursor = Nullable(String)
    direction = Nullable(String)
    display = Nullable(String)
    dominant_baseline = Nullable(String)
    empty_cells = Nullable(String)
    fill = Nullable(String)
    fill_opacity = Nullable(String)
    fill_rule = Nullable(String)
    filter = Nullable(String)
    flex = Nullable(String)
    flex_basis = Nullable(String)
    flex_direction = Nullable(String)
    flex_flow = Nullable(String)
    flex_grow = Nullable(String)
    flex_shrink = Nullable(String)
    flex_wrap = Nullable(String)
    float = Nullable(String)
    flood_color = Nullable(String)
    flood_opacity = Nullable(String)
    font = Nullable(String)
    font_family = Nullable(String)
    font_feature_settings = Nullable(String)
    font_kerning = Nullable(String)
    font_size = Nullable(String)
    font_size_adjust = Nullable(String)
    font_stretch = Nullable(String)
    font_style = Nullable(String)
    font_synthesis = Nullable(String)
    font_variant = Nullable(String)
    font_variant_caps = Nullable(String)
    font_variant_east_asian = Nullable(String)
    font_variant_ligatures = Nullable(String)
    font_variant_numeric = Nullable(String)
    font_variant_position = Nullable(String)
    font_weight = Nullable(String)
    gap = Nullable(String)
    glyph_orientation_vertical = Nullable(String)
    grid = Nullable(String)
    grid_area = Nullable(String)
    grid_auto_columns = Nullable(String)
    grid_auto_flow = Nullable(String)
    grid_auto_rows = Nullable(String)
    grid_column = Nullable(String)
    grid_column_end = Nullable(String)
    grid_column_gap = Nullable(String)
    grid_column_start = Nullable(String)
    grid_gap = Nullable(String)
    grid_row = Nullable(String)
    grid_row_end = Nullable(String)
    grid_row_gap = Nullable(String)
    grid_row_start = Nullable(String)
    grid_template = Nullable(String)
    grid_template_areas = Nullable(String)
    grid_template_columns = Nullable(String)
    grid_template_rows = Nullable(String)
    height = Nullable(String)
    hyphens = Nullable(String)
    image_orientation = Nullable(String)
    image_rendering = Nullable(String)
    inline_size = Nullable(String)
    justify_content = Nullable(String)
    justify_items = Nullable(String)
    justify_self = Nullable(String)
    left = Nullable(String)
    letter_spacing = Nullable(String)
    lighting_color = Nullable(String)
    line_break = Nullable(String)
    line_height = Nullable(String)
    list_style = Nullable(String)
    list_style_image = Nullable(String)
    list_style_position = Nullable(String)
    list_style_type = Nullable(String)
    margin = Nullable(String)
    margin_block_end = Nullable(String)
    margin_block_start = Nullable(String)
    margin_bottom = Nullable(String)
    margin_inline_end = Nullable(String)
    margin_inline_start = Nullable(String)
    margin_left = Nullable(String)
    margin_right = Nullable(String)
    margin_top = Nullable(String)
    marker = Nullable(String)
    marker_end = Nullable(String)
    marker_mid = Nullable(String)
    marker_start = Nullable(String)
    mask = Nullable(String)
    mask_composite = Nullable(String)
    mask_image = Nullable(String)
    mask_position = Nullable(String)
    mask_repeat = Nullable(String)
    mask_size = Nullable(String)
    mask_type = Nullable(String)
    max_block_size = Nullable(String)
    max_height = Nullable(String)
    max_inline_size = Nullable(String)
    max_width = Nullable(String)
    min_block_size = Nullable(String)
    min_height = Nullable(String)
    min_inline_size = Nullable(String, help="""
    The `min-inline-size`_ CSS property defines the horizontal or vertical
    minimal size of an element's block, depending on its writing mode. It
    corresponds to either the ``min-width`` or the ``min-height`` property,
    depending on the value of ``writing-mode``.

    .. _min-inline-size: https://developer.mozilla.org/en-US/docs/Web/CSS/min-inline-size
    """)

    min_width = Nullable(String)
    object_fit = Nullable(String)
    object_position = Nullable(String)
    opacity = Nullable(String)
    order = Nullable(String)
    orphans = Nullable(String)
    outline = Nullable(String)
    outline_color = Nullable(String)
    outline_offset = Nullable(String)
    outline_style = Nullable(String)
    outline_width = Nullable(String)
    overflow = Nullable(String)
    overflow_anchor = Nullable(String)
    overflow_wrap = Nullable(String)
    overflow_x = Nullable(String)
    overflow_y = Nullable(String)
    overscroll_behavior = Nullable(String)
    overscroll_behavior_block = Nullable(String)
    overscroll_behavior_inline = Nullable(String)
    overscroll_behavior_x = Nullable(String)
    overscroll_behavior_y = Nullable(String)
    padding = Nullable(String)
    padding_block_end = Nullable(String)
    padding_block_start = Nullable(String)
    padding_bottom = Nullable(String)
    padding_inline_end = Nullable(String)
    padding_inline_start = Nullable(String)
    padding_left = Nullable(String)
    padding_right = Nullable(String)
    padding_top = Nullable(String)
    page_break_after = Nullable(String)
    page_break_before = Nullable(String)
    page_break_inside = Nullable(String)
    paint_order = Nullable(String)
    perspective = Nullable(String)
    perspective_origin = Nullable(String)
    place_content = Nullable(String)
    place_items = Nullable(String)
    place_self = Nullable(String)
    pointer_events = Nullable(String)
    position = Nullable(String)
    quotes = Nullable(String)
    resize = Nullable(String)
    right = Nullable(String)
    rotate = Nullable(String)
    row_gap = Nullable(String)
    ruby_align = Nullable(String)
    ruby_position = Nullable(String)
    scale = Nullable(String)
    scroll_behavior = Nullable(String)
    shape_rendering = Nullable(String)
    stop_color = Nullable(String)
    stop_opacity = Nullable(String)
    stroke = Nullable(String)
    stroke_dasharray = Nullable(String)
    stroke_dashoffset = Nullable(String)
    stroke_linecap = Nullable(String)
    stroke_linejoin = Nullable(String)
    stroke_miterlimit = Nullable(String)
    stroke_opacity = Nullable(String)
    stroke_width = Nullable(String)
    tab_size = Nullable(String)
    table_layout = Nullable(String)
    text_align = Nullable(String)
    text_align_last = Nullable(String)
    text_anchor = Nullable(String)
    text_combine_upright = Nullable(String)
    text_decoration = Nullable(String)
    text_decoration_color = Nullable(String)
    text_decoration_line = Nullable(String)
    text_decoration_style = Nullable(String)
    text_emphasis = Nullable(String)
    text_emphasis_color = Nullable(String)
    text_emphasis_position = Nullable(String)
    text_emphasis_style = Nullable(String)
    text_indent = Nullable(String)
    text_justify = Nullable(String)
    text_orientation = Nullable(String)
    text_overflow = Nullable(String)
    text_rendering = Nullable(String)
    text_shadow = Nullable(String)
    text_transform = Nullable(String)
    text_underline_position = Nullable(String)
    top = Nullable(String)
    touch_action = Nullable(String)
    transform = Nullable(String)
    transform_box = Nullable(String)
    transform_origin = Nullable(String)
    transform_style = Nullable(String)
    transition = Nullable(String)
    transition_delay = Nullable(String)
    transition_duration = Nullable(String)
    transition_property = Nullable(String)
    transition_timing_function = Nullable(String)
    translate = Nullable(String)
    unicode_bidi = Nullable(String)
    user_select = Nullable(String)
    vertical_align = Nullable(String)
    visibility = Nullable(String)
    white_space = Nullable(String)
    widows = Nullable(String)
    width = Nullable(String)
    will_change = Nullable(String)
    word_break = Nullable(String)
    word_spacing = Nullable(String)
    word_wrap = Nullable(String)
    writing_mode = Nullable(String)
    z_index = Nullable(String)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
