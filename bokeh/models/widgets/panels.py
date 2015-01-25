"""

"""
from __future__ import absolute_import

from ...properties import Bool, Int, String, Instance, List
from ..widget import Widget

class Panel(Widget):
    """

    """

    title = String(help="""

    """)

    child = Instance(Widget, help="""

    """)

    closable = Bool(False, help="""

    """)


class Tabs(Widget):
    """

    """

    tabs = List(Instance(Panel), help="""

    """)

    active = Int(0, help="""

    """)

