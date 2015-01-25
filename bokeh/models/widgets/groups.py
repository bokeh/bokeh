"""

"""
from __future__ import absolute_import

from ...properties import Bool, Int, String, Enum, Instance, List
from ...enums import ButtonType
from ..widget import Widget

class AbstractGroup(Widget):
    """

    """

    labels = List(String, help="""

    """)

    def on_click(self, handler):
        """

        """

        self.on_change('active', lambda obj, attr, old, new: handler(new))

class Group(AbstractGroup):
    """

    """

    inline = Bool(False, help="""

    """)

class ButtonGroup(AbstractGroup):
    """

    """

    type = Enum(ButtonType, help="""

    """)

class CheckboxGroup(Group):
    """

    """

    active = List(Int, help="""

    """)

class RadioGroup(Group):
    """

    """

    active = Int(None, help="""

    """)

class CheckboxButtonGroup(ButtonGroup):
    """

    """

    active = List(Int, help="""

    """)

class RadioButtonGroup(ButtonGroup):
    """

    """

    active = Int(None, help="""

    """)
