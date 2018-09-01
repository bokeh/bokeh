#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Various kinds of layout components.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from ..core.enums import SizingMode, SizingPolicy, Location, TrackAlign
from ..core.has_props import abstract
from ..core.properties import Bool, Enum, Int, Float, Instance, List, Seq, Tuple, Dict, String, Either, Struct
from ..core.validation import warning
from ..core.validation.warnings import BOTH_CHILD_AND_ROOT, EMPTY_LAYOUT
from ..model import Model
from .callbacks import Callback

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Box',
    'Column',
    'GridBox',
    'LayoutDOM',
    'Row',
    'Spacer',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class LayoutDOM(Model):
    ''' An abstract base class for layout components.

    '''

    disabled = Bool(False, help="""
    Whether the widget will be disabled when rendered. If ``True``,
    the widget will be greyed-out, and not respond to UI events.
    """)

    visible = Bool(True, help="""
    Whether the widget will be visible and a part of a layout.
    """)

    width = Int(default=None, help="""
    An optional width for the component (in pixels).
    """)

    height = Int(default=None, help="""
    An optional height for the component (in pixels).
    """)

    width_policy = Enum(SizingPolicy, default="auto", help="""
    """)

    height_policy = Enum(SizingPolicy, default="auto", help="""
    """)

    aspect_ratio = Either(Enum("auto"), Float, default=None, help="""

    """)

    sizing_mode = Enum(SizingMode, default=None, help="""
    How the item being displayed should size itself. Possible values are ``"fixed"``,
    ``"scale_width"``, ``"scale_height"``, ``"scale_both"``, and ``"stretch_both"``.

    ``"fixed"`` elements are not responsive. They will retain their original width and height
    regardless of any subsequent browser window resize events.

    ``"stretch_both"`` elements are completely responsive (independently in width and height) and
    will resize to occupy all available space, even if this changes the aspect ratio of the layout.

    ``"scale_width"`` elements will responsively resize to stretch to the available width, *while
    maintaining the original or provided aspect ratio*.

    ``"scale_height"`` elements will responsively resize to stretch to the available height, *while
    maintaining the original or provided aspect ratio*.

    ``"scale_both"`` elements will responsively resize to for both the width and height available,
    *while maintaining the original or provided aspect ratio*.

    """)

    # List in order for in-place changes to trigger changes, ref: https://github.com/bokeh/bokeh/issues/6841
    css_classes = List(String, help="""
    A list of CSS class names to add to this DOM element. Note: the class names are
    simply added as-is, no other guarantees are provided.

    It is also permissible to assign from tuples, however these are adapted -- the
    property will always contain a list.
    """).accepts(Seq(String), lambda x: list(x))


class Spacer(LayoutDOM):
    ''' A container for space used to fill an empty spot in a row or column.

    '''

RowSizing = Either(
    Enum("auto", "min", "max"),
    Int,
    Struct(policy=Enum("auto", "min", "max"), align=Enum(TrackAlign)),
    Struct(policy=Enum("fixed"), height=Int, align=Enum(TrackAlign)),
    Struct(policy=Enum("flex"), factor=Float, align=Enum(TrackAlign)))

ColSizing = Either(
    Enum("auto", "min", "max"),
    Int,
    Struct(policy=Enum("auto", "min", "max"), align=Enum(TrackAlign)),
    Struct(policy=Enum("fixed"), width=Int, align=Enum(TrackAlign)),
    Struct(policy=Enum("flex"), factor=Float, align=Enum(TrackAlign)))

class GridBox(LayoutDOM):

    children = List(Tuple(Instance(LayoutDOM), Int, Int), default=[], help="""
    """)

    rows = Dict(Int, RowSizing, default={}, help="""
    """)

    cols = Dict(Int, ColSizing, default={}, help="""
    """)

@abstract
class Box(LayoutDOM):
    ''' Abstract base class for Row and Column. Do not use directly.

    '''

    def __init__(self, *args, **kwargs):

        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        elif len(args) > 0:
            kwargs["children"] = list(args)

        super(Box, self).__init__(**kwargs)

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

    children = List(Instance(LayoutDOM), help="""
    The list of children, which can be other components including plots, rows, columns, and widgets.
    """)


class Row(Box):
    ''' Lay out child components in a single horizontal row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    '''

    cols = Dict(Int, ColSizing, default={}, help="""
    """)

class Column(Box):
    ''' Lay out child components in a single vertical row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    '''

    rows = Dict(Int, RowSizing, default={}, help="""
    """)

class Panel(Model):
    ''' A single-widget container with title bar and controls.

    '''

    title = String(default="", help="""
    The text title of the panel.
    """)

    child = Instance(LayoutDOM, help="""
    The child widget. If you need more children, use a layout widget, e.g. a ``Column``.
    """)

class Tabs(LayoutDOM):
    ''' A panel widget with navigation tabs.

    '''

    __example__ = "sphinx/source/docs/user_guide/examples/interaction_tab_panes.py"

    tabs = List(Instance(Panel), help="""
    The list of child panel widgets.
    """).accepts(List(Tuple(String, Instance(LayoutDOM))),
                 lambda items: [ Panel(title=title, child=child) for (title, child) in items ])

    tabs_location = Enum(Location, default="above", help="""
    The location of the buttons that activate tabs.
    """)

    active = Int(0, help="""
    The index of the active tab.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the button is activated.
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
