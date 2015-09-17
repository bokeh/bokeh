"""

"""
from __future__ import absolute_import

from ...properties import abstract
from ...properties import Bool, Int, String, Enum, List
from ...enums import ButtonType
from ..widget import Widget

@abstract
class AbstractGroup(Widget):
    """ Abstract base class for all kinds of groups. ``AbstractGroup``
    is not generally useful to instantiate on its own.

    """

    labels = List(String, help="""
    List of text labels contained in this group.
    """)

    def on_click(self, handler):
        """ Set up a handler for button check/radio box clicks including
        the selected indices.

        Args:
            handler (func) : handler function to call when button is clicked.

        Returns:
            None

        """
        self.on_change('active', lambda obj, attr, old, new: handler(new))

@abstract
class ButtonGroup(AbstractGroup):
    """ Abstract base class for groups with items rendered as buttons.
    ``ButtonGroup`` is not generally useful to instantiate on its own.

     """

    type = Enum(ButtonType, help="""
    A style for the button, signifying it's role.
    """)

@abstract
class Group(AbstractGroup):
    """ Abstract base class for groups with items rendered as check/radio
    boxes.

    """

    inline = Bool(False, help="""
    Should items be arrange vertically (``False``) or horizontally
    in-line (``True``).
    """)

class CheckboxGroup(Group):
    """ A group of check boxes.

    """

    active = List(Int, help="""
    The list of indices of selected check boxes.
    """)

class RadioGroup(Group):
    """ A group of radio boxes.

    """

    active = Int(None, help="""
    The index of the selected radio box, or ``None`` if nothing is
    selected.
    """)

class CheckboxButtonGroup(ButtonGroup):
    """ A group of check boxes rendered as toggle buttons.

    """

    active = List(Int, help="""
    The list of indices of selected check boxes.
    """)

class RadioButtonGroup(ButtonGroup):
    """ A group of radio boxes rendered as toggle buttons.

    """

    active = Int(None, help="""
    The index of the selected radio box, or ``None`` if nothing is
    selected.
    """)
