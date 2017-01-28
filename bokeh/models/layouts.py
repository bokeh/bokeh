''' Various kinds of layout components.

'''
from __future__ import absolute_import

import logging
logger = logging.getLogger(__name__)

from ..core.enums import SizingMode
from ..core.has_props import abstract
from ..core.properties import Bool, Enum, Int, Instance, List, Seq, String
from ..core.validation import warning
from ..core.validation.warnings import BOTH_CHILD_AND_ROOT, EMPTY_LAYOUT
from ..embed import notebook_div
from ..model import Model
from ..util.deprecation import deprecated

@abstract
class LayoutDOM(Model):
    ''' An abstract base class for layout components.

    '''

    width = Int(help="""
    An optional width for the component (in pixels).
    """)

    height = Int(help="""
    An optional height for the component (in pixels).
    """)

    disabled = Bool(False, help="""
    Whether the widget will be disabled when rendered. If ``True``,
    the widget will be greyed-out, and not respond to UI events.
    """)

    sizing_mode = Enum(SizingMode, default="fixed", help="""
    How the item being displayed should size itself. Possible values are
    ``"fixed"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"``, and
    ``"stretch_both"``.

    ``"stretch_both"`` elements are completely responsive (independently in width and height) and
    will resize to occupy all available space, even if this changes the aspect ratio of the element.
    This is sometimes called outside-in, and is a typical behavior for desktop applications.

    ``"fixed"`` elements are not responsive. They will retain their original width and height
    regardless of any subsequent browser window resize events.

    ``"scale_width"`` elements will responsively resize to fit to the width available, *while
    maintaining the original aspect ratio*. This is a typical behavior for modern websites. For a
    ``Plot``, the aspect ratio ``plot_width/plot_height`` is maintained.

    ``"scale_height"`` elements will responsively resize to fit to the height available, *while
    maintaining the original aspect ratio*. For a ``Plot``, the aspect ratio
    ``plot_width/plot_height`` is maintained. A plot with ``"scale_height"`` mode needs
    to be wrapped in a ``Row`` or ``Column`` to be responsive.

    ``"scale_both"`` elements will responsively resize to for both the width and height available,
    *while maintaining the original aspect ratio*.

    """)

    css_classes = Seq(String, help="""
    A list of css class names to add to this DOM element. Note: the class names are
    simply added as-is, no other guarantees are provided.
    """)

    @property
    def html(self):
        from IPython.core.display import HTML
        return HTML(notebook_div(self))


class Spacer(LayoutDOM):
    ''' A container for space used to fill an empty spot in a row or column.

    '''


class WidgetBox(LayoutDOM):
    ''' A container for widgets that are part of a layout.

    '''
    def __init__(self, *args, **kwargs):
        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        elif len(args) > 0:
            kwargs["children"] = list(args)
        super(WidgetBox, self).__init__(**kwargs)

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

    children = List(Instance('bokeh.models.widgets.Widget'), help="""
    The list of widgets to put in the layout box.
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

        unwrapped_children = kwargs.get("children", [])
        kwargs["children"] = self._wrap_children(unwrapped_children)
        super(Box, self).__init__(**kwargs)

    def _wrap_children(self, children):
        ''' Wrap any Widgets of a list of child layouts in a WidgetBox.
        This allows for the convenience of just spelling Row(button1, button2).
        '''
        from .widgets.widget import Widget
        wrapped_children = []
        for child in children:
            if isinstance(child, Widget):
                child = WidgetBox(
                    children=[child],
                    sizing_mode=child.sizing_mode,
                    width=child.width,
                    height=child.height,
                    disabled=child.disabled
                )
            wrapped_children.append(child)
        return wrapped_children

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

    #TODO Debating the following instead to prevent people adding just a plain
    #     widget into a box, which sometimes works and sometimes looks disastrous
    #children = List(
    #    Either(
    #        Instance('bokeh.models.layouts.Row'),
    #        Instance('bokeh.models.layouts.Column'),
    #        Instance('bokeh.models.plots.Plot'),
    #        Instance('bokeh.models.layouts.WidgetBox')
    #    ), help="""
    #    The list of children, which can be other components including plots, rows, columns, and widgets.
    #""")
    children = List(Instance(LayoutDOM), help="""
    The list of children, which can be other components including plots, rows, columns, and widgets.
    """)


class Row(Box):
    ''' Lay out child components in a single horizontal row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    '''


class Column(Box):
    ''' Lay out child components in a single vertical row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    '''


def HBox(*args, **kwargs):
    ''' Lay out child components in a single horizontal row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.

    Returns a Row instance.
    '''
    deprecated((0, 12, 5), 'bokeh.models.HBox', 'bokeh.models.Row')
    return Row(*args, **kwargs)


def VBox(*args, **kwargs):
    ''' Lay out child components in a single vertical row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.

    Returns a Column instance.
    '''
    deprecated((0, 12, 5), 'bokeh.models.VBox', 'bokeh.models.Column')
    return Column(*args, **kwargs)
