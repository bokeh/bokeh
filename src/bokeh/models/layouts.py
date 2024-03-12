#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Various kinds of layout components.

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

# Bokeh imports
from ..colors import RGB, Color, ColorLike
from ..core.enums import (
    Align,
    Dimensions,
    FlowMode,
    Location,
    ScrollbarPolicy,
    SizingMode,
    SizingPolicy,
)
from ..core.has_props import HasProps, abstract
from ..core.properties import (
    Auto,
    Bool,
    Either,
    Enum,
    Float,
    Instance,
    Int,
    List,
    NonNegative,
    Null,
    Nullable,
    String,
    Struct,
    Tuple,
)
from ..core.property.struct import Optional
from ..core.property_aliases import GridSpacing, Pixels, TracksSizing
from ..core.validation import error, warning
from ..core.validation.errors import (
    MIN_PREFERRED_MAX_HEIGHT,
    MIN_PREFERRED_MAX_WIDTH,
    REPEATED_LAYOUT_CHILD,
)
from ..core.validation.warnings import (
    BOTH_CHILD_AND_ROOT,
    EMPTY_LAYOUT,
    FIXED_HEIGHT_POLICY,
    FIXED_SIZING_MODE,
    FIXED_WIDTH_POLICY,
)
from ..model import Model
from .ui.panes import Pane
from .ui.tooltips import Tooltip
from .ui.ui_element import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Column',
    'FlexBox',
    'GridBox',
    'GroupBox',
    'HBox',
    'LayoutDOM',
    'Row',
    'ScrollBox',
    'Spacer',
    'TabPanel',
    'Tabs',
    'VBox',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class LayoutDOM(Pane):
    """ The base class for layoutable components.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    disabled = Bool(False, help="""
    Whether the widget will be disabled when rendered.

    If ``True``, the widget will be greyed-out and not responsive to UI events.
    """)

    width: int | None = Nullable(NonNegative(Int), help="""
    The width of the component (in pixels).

    This can be either fixed or preferred width, depending on width sizing policy.
    """)

    height: int | None = Nullable(NonNegative(Int), help="""
    The height of the component (in pixels).

    This can be either fixed or preferred height, depending on height sizing policy.
    """)

    min_width = Nullable(NonNegative(Int), help="""
    Minimal width of the component (in pixels) if width is adjustable.
    """)

    min_height = Nullable(NonNegative(Int), help="""
    Minimal height of the component (in pixels) if height is adjustable.
    """)

    max_width = Nullable(NonNegative(Int), help="""
    Maximal width of the component (in pixels) if width is adjustable.
    """)

    max_height = Nullable(NonNegative(Int), help="""
    Maximal height of the component (in pixels) if height is adjustable.
    """)

    margin = Nullable(Either(Int, Tuple(Int, Int), Tuple(Int, Int, Int, Int)), help="""
    Allows to create additional space around the component.
    The values in the tuple are ordered as follows - Margin-Top, Margin-Right, Margin-Bottom and Margin-Left,
    similar to CSS standards.
    Negative margin values may be used to shrink the space from any direction.
    """)

    width_policy = Either(Auto, Enum(SizingPolicy), default="auto", help="""
    Describes how the component should maintain its width.

    ``"auto"``
        Use component's preferred sizing policy.

    ``"fixed"``
        Use exactly ``width`` pixels. Component will overflow if it can't fit in the
        available horizontal space.

    ``"fit"``
        Use component's preferred width (if set) and allow it to fit into the available
        horizontal space within the minimum and maximum width bounds (if set). Component's
        width neither will be aggressively minimized nor maximized.

    ``"min"``
        Use as little horizontal space as possible, not less than the minimum width (if set).
        The starting point is the preferred width (if set). The width of the component may
        shrink or grow depending on the parent layout, aspect management and other factors.

    ``"max"``
        Use as much horizontal space as possible, not more than the maximum width (if set).
        The starting point is the preferred width (if set). The width of the component may
        shrink or grow depending on the parent layout, aspect management and other factors.

    .. note::
        This is an experimental feature and may change in future. Use it at your
        own discretion. Prefer using ``sizing_mode`` if this level of control isn't
        strictly necessary.

    """)

    height_policy = Either(Auto, Enum(SizingPolicy), default="auto", help="""
    Describes how the component should maintain its height.

    ``"auto"``
        Use component's preferred sizing policy.

    ``"fixed"``
        Use exactly ``height`` pixels. Component will overflow if it can't fit in the
        available vertical space.

    ``"fit"``
        Use component's preferred height (if set) and allow to fit into the available
        vertical space within the minimum and maximum height bounds (if set). Component's
        height neither will be aggressively minimized nor maximized.

    ``"min"``
        Use as little vertical space as possible, not less than the minimum height (if set).
        The starting point is the preferred height (if set). The height of the component may
        shrink or grow depending on the parent layout, aspect management and other factors.

    ``"max"``
        Use as much vertical space as possible, not more than the maximum height (if set).
        The starting point is the preferred height (if set). The height of the component may
        shrink or grow depending on the parent layout, aspect management and other factors.

    .. note::
        This is an experimental feature and may change in future. Use it at your
        own discretion. Prefer using ``sizing_mode`` if this level of control isn't
        strictly necessary.

    """)

    aspect_ratio = Either(Null, Auto, Float, help="""
    Describes the proportional relationship between component's width and height.

    This works if any of component's dimensions are flexible in size. If set to
    a number, ``width / height = aspect_ratio`` relationship will be maintained.
    Otherwise, if set to ``"auto"``, component's preferred width and height will
    be used to determine the aspect (if not set, no aspect will be preserved).

    """)

    flow_mode = Enum(FlowMode, default="block", help="""
    Defines whether the layout will flow in the ``block`` or ``inline`` dimension.
    """)

    sizing_mode = Nullable(Enum(SizingMode), help="""
    How the component should size itself.

    This is a high-level setting for maintaining width and height of the component. To
    gain more fine grained control over sizing, use ``width_policy``, ``height_policy``
    and ``aspect_ratio`` instead (those take precedence over ``sizing_mode``).

    Possible scenarios:

    ``"inherit"``
        The sizing mode is inherited from the parent layout. If there is no parent
        layout (or parent is not a layout), then this value is treated as if no
        value for ``sizing_mode`` was provided.

    ``"fixed"``
        Component is not responsive. It will retain its original width and height
        regardless of any subsequent browser window resize events.

    ``"stretch_width"``
        Component will responsively resize to stretch to the available width, without
        maintaining any aspect ratio. The height of the component depends on the type
        of the component and may be fixed or fit to component's contents.

    ``"stretch_height"``
        Component will responsively resize to stretch to the available height, without
        maintaining any aspect ratio. The width of the component depends on the type
        of the component and may be fixed or fit to component's contents.

    ``"stretch_both"``
        Component is completely responsive, independently in width and height, and
        will occupy all the available horizontal and vertical space, even if this
        changes the aspect ratio of the component.

    ``"scale_width"``
        Component will responsively resize to stretch to the available width, while
        maintaining the original or provided aspect ratio.

    ``"scale_height"``
        Component will responsively resize to stretch to the available height, while
        maintaining the original or provided aspect ratio.

    ``"scale_both"``
        Component will responsively resize to both the available width and height, while
        maintaining the original or provided aspect ratio.

    """)

    align = Either(Auto, Enum(Align), Tuple(Enum(Align), Enum(Align)), default="auto", help="""
    The alignment point within the parent container.

    This property is useful only if this component is a child element of a layout
    (e.g. a grid). Self alignment can be overridden by the parent container (e.g.
    grid track align).
    """)

    resizable = Either(Bool, Enum(Dimensions), default=False, help="""
    Whether the layout is interactively resizable, and if so in which dimensions.
    """)

    def _set_background(self, color: ColorLike) -> None:
        """ Background color of the component. """
        if isinstance(color, Color):
            color = color.to_css()
        elif isinstance(color, tuple):
            color = RGB.from_tuple(color).to_css()

        if isinstance(self.styles, dict):
            self.styles["background-color"] = color
        else:
            self.styles.background_color = color

    background = property(None, _set_background)

    @warning(FIXED_SIZING_MODE)
    def _check_fixed_sizing_mode(self):
        if self.sizing_mode == "fixed" and (self.width is None or self.height is None):
            return str(self)

    @warning(FIXED_WIDTH_POLICY)
    def _check_fixed_width_policy(self):
        if self.width_policy == "fixed" and self.width is None:
            return str(self)

    @warning(FIXED_HEIGHT_POLICY)
    def _check_fixed_height_policy(self):
        if self.height_policy == "fixed" and self.height is None:
            return str(self)

    @error(MIN_PREFERRED_MAX_WIDTH)
    def _check_min_preferred_max_width(self):
        min_width = self.min_width if self.min_width is not None else 0
        width     = self.width     if self.width     is not None and (self.sizing_mode == "fixed" or self.width_policy == "fixed") else min_width
        max_width = self.max_width if self.max_width is not None else width

        if not (min_width <= width <= max_width):
            return str(self)

    @error(MIN_PREFERRED_MAX_HEIGHT)
    def _check_min_preferred_max_height(self):
        min_height = self.min_height if self.min_height is not None else 0
        height     = self.height     if self.height     is not None and (self.sizing_mode == "fixed" or self.height_policy == "fixed") else min_height
        max_height = self.max_height if self.max_height is not None else height

        if not (min_height <= height <= max_height):
            return str(self)

    def _sphinx_height_hint(self) -> int|None:
        if self.sizing_mode in ("stretch_width", "fixed", None):
            return self.height
        return None

class Spacer(LayoutDOM):
    ''' A container for space used to fill an empty spot in a row or column.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

@abstract
class GridCommon(HasProps):
    """ Common properties for grid-like layouts. """

    rows = Nullable(TracksSizing, default=None, help="""
    Describes how the grid should maintain its rows' heights.

    This maps to CSS grid's track sizing options. In particular the following
    values are allowed:

    * length, e.g. ``100px``, ``5.5em``
    * percentage, e.g. ``33%``
    * flex, e.g. 1fr
    * enums, e.g.  ``max-content``, ``min-content``, ``auto``, etc.

    If a single value is provided, then it applies to all rows. A list of
    values can be provided to size all rows, or a dictionary providing
    sizing for individual rows.

    See https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-rows
    or https://w3c.github.io/csswg-drafts/css-grid/#track-sizing for details.
    """)

    cols = Nullable(TracksSizing, default=None, help="""
    Describes how the grid should maintain its columns' widths.

    This maps to CSS grid's track sizing options. In particular the following
    values are allowed:

    * length, e.g. ``100px``, ``5.5em``
    * percentage, e.g. ``33%``
    * flex, e.g. 1fr
    * enums, e.g.  ``max-content``, ``min-content``, ``auto``, etc.

    If a single value is provided, then it applies to all columns. A list of
    values can be provided to size all columns, or a dictionary providing
    sizing for individual columns.

    See https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-columns
    or https://w3c.github.io/csswg-drafts/css-grid/#track-sizing for details.
    """)

    spacing = GridSpacing(default=0, help="""
    The gap between children (in pixels).

    Either a number, if spacing is the same for both dimensions, or a pair
    of numbers indicating spacing in the vertical and horizontal dimensions
    respectively.
    """)

class GridBox(LayoutDOM, GridCommon):
    """ A CSS grid-based grid container. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    children = List(Either(
        Tuple(Instance(UIElement), Int, Int),
        Tuple(Instance(UIElement), Int, Int, Int, Int)), default=[], help="""
    A list of children with their associated position in the grid (row, column).
    """)

    @error(REPEATED_LAYOUT_CHILD)
    def _check_repeated_layout_children(self):
        children = [ child[0] for child in self.children ]
        if len(children) != len(set(children)):
            return str(self)

class HBox(LayoutDOM):
    """ A CSS grid-based horizontal box. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    children = List(Struct(child=Instance(UIElement), col=Optional(Int), span=Optional(Int)), default=[], help="""
    A list of children with their associated position in the horizontal box (optional; column number, span).
    """).accepts(List(Instance(UIElement)), lambda children: [ dict(child=child) for child in children ])

    cols = Nullable(TracksSizing, default=None, help="""
    Describes how the grid should maintain its columns' widths.
    """)

    spacing = Pixels(default=0, help="""
    The gap between children (in pixels).
    """)

    @error(REPEATED_LAYOUT_CHILD)
    def _check_repeated_layout_children(self):
        children = [ item["child"] for item in self.children ]
        if len(children) != len(set(children)):
            return str(self)

class VBox(LayoutDOM):
    """ A CSS grid-based vertical box. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    children = List(Struct(child=Instance(UIElement), row=Optional(Int), span=Optional(Int)), default=[], help="""
    A list of children with their associated position in the vertical box (optional; row number, span).
    """).accepts(List(Instance(UIElement)), lambda children: [ dict(child=child) for child in children ])

    rows = Nullable(TracksSizing, default=None, help="""
    Describes how the grid should maintain its rows' heights.
    """)

    spacing = Pixels(default=0, help="""
    The gap between children (in pixels).
    """)

    @error(REPEATED_LAYOUT_CHILD)
    def _check_repeated_layout_children(self):
        children = [ item["child"] for item in self.children ]
        if len(children) != len(set(children)):
            return str(self)

@abstract
class FlexBox(LayoutDOM):
    ''' Abstract base class for Row and Column. Do not use directly.

    '''

    def __init__(self, *args, **kwargs) -> None:

        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        elif len(args) > 0:
            kwargs["children"] = list(args)

        super().__init__(**kwargs)

    @warning(EMPTY_LAYOUT)
    def _check_empty_layout(self):
        from itertools import chain
        if not list(chain(self.children)):
            return str(self)

    @warning(BOTH_CHILD_AND_ROOT)
    def _check_child_is_also_root(self):
        problems = []
        for c in self.children:
            if c.document is not None and c in c.document.roots:
                problems.append(str(c))
        if problems:
            return ", ".join(problems)
        else:
            return None

    @error(REPEATED_LAYOUT_CHILD)
    def _check_repeated_layout_children(self):
        if len(self.children) != len(set(self.children)):
            return str(self)

    children = List(Instance(UIElement), help="""
    The list of children, which can be other components including plots, rows, columns, and widgets.
    """)

    spacing = Int(default=0, help="""
    The gap between children (in pixels).
    """)


class Row(FlexBox):
    ''' Lay out child components in a single horizontal row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    def _sphinx_height_hint(self) -> int|None:
        if any(x._sphinx_height_hint() is None for x in self.children):
            return None
        return max(x._sphinx_height_hint() for x in self.children)

class Column(FlexBox):
    ''' Lay out child components in a single vertical row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    def _sphinx_height_hint(self) -> int|None:
        if any(x._sphinx_height_hint() is None for x in self.children):
            return None
        return sum(x._sphinx_height_hint() for x in self.children)

class TabPanel(Model):
    ''' A single-widget container with title bar and controls.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    title = String(default="", help="""
    The text title of the panel.
    """)

    tooltip = Nullable(Instance(Tooltip), default=None, help="""
    A tooltip with plain text or rich HTML contents, providing general help or
    description of a widget's or component's function.
    """)

    child = Instance(UIElement, help="""
    The child widget. If you need more children, use a layout widget, e.g. a ``Column``.
    """)

    closable = Bool(False, help="""
    Whether this panel is closable or not. If True, an "x" button will appear.

    Closing a panel is equivalent to removing it from its parent container (e.g. tabs).
    """)

    disabled = Bool(False, help="""
    Whether the widget is responsive to UI events.
    """)

class Tabs(LayoutDOM):
    ''' A panel widget with navigation tabs.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    __example__ = "examples/interaction/widgets/tab_panes.py"

    tabs = List(Instance(TabPanel), help="""
    The list of child panel widgets.
    """).accepts(List(Tuple(String, Instance(UIElement))),
                 lambda items: [ TabPanel(title=title, child=child) for (title, child) in items ])

    tabs_location = Enum(Location, default="above", help="""
    The location of the buttons that activate tabs.
    """)

    active = Int(0, help="""
    The index of the active tab.
    """)

class GroupBox(LayoutDOM):
    ''' A panel that allows to group UI elements.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    title = Nullable(String, help="""
    The title text of the group. If not provided, only the frame will be showed.
    """)

    child = Instance(UIElement, help="""
    The child UI element. This can be a single UI control, widget, etc., or
    a container layout like ``Column`` or ``Row``, or a combitation of layouts.
    """)

    checkable = Bool(False, help="""
    Whether to allow disabling this group (all its children) via a checkbox
    in the UI. This allows to broadcast ``disabled`` state across multiple
    UI controls that support that state.
    """)

class ScrollBox(LayoutDOM):
    ''' A panel that allows to scroll overflowing UI elements.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    child = Instance(UIElement, help="""
    The child UI element. This can be a single UI control, widget, etc., or
    a container layout like ``Column`` or ``Row``, or a combitation of layouts.
    """)

    horizontal_scrollbar = Enum(ScrollbarPolicy, default="auto", help="""
    The visibility of the horizontal scrollbar.
    """)

    vertical_scrollbar = Enum(ScrollbarPolicy, default="auto", help="""
    The visibility of the vertical scrollbar.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
