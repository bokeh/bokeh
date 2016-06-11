""" Various kinds of dialog and message box widgets. """

from __future__ import absolute_import

from ...core.properties import Bool, String, List, Instance, Either
from ..layouts import Box, Row
from .widget import Widget
from .buttons import Button


class Dialog(Widget):
    """ Simple dialog box with string message.

    """

    visible = Bool(False, help="""
    Whether this dialog is visible or not.
    """)

    # TODO (bev) : "closeable" would be more common spelling
    closable = Bool(True, help="""
    Whether this dialog is closable or not.
    """)

    title = String(default="", help="""
    The title of the dialog widget.
    """)

    content = Either(String(), Instance(Box), default="", help="""
    Either a message to be displayed by this dialog or a Box to be used
    as dialog body.
    """)

    buttons = List(Instance(Button), help="""
    A list of buttons to be placed on the bottom of the dialog.
    """)

    buttons_box = Instance(Box, help="""
    A Box with buttons to be used as dialog footer.
    """)

    def __init__(self, **kwargs):
        if "buttons" in kwargs and "buttons_box" in kwargs:
            raise ValueError("'buttons' keyword cannot be used with 'buttons_box' argument")

        if 'buttons' in kwargs:
            kwargs['buttons_box'] = Row(children=kwargs['buttons'])

        elif 'buttons_box' in kwargs:
            kwargs['buttons'] = kwargs['buttons_box'].children

        super(Dialog, self).__init__(**kwargs)
