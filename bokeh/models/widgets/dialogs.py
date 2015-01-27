""" Various kinds of dialog and message box widgets. """

from __future__ import absolute_import

from ...properties import Bool, String, List
from ..widget import Widget

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

    title = String(help="""
    The title of the dialog widget.
    """)

    content = String(help="""
    The message displayed by this dialog.
    """)

    buttons = List(String, help="""
    A list of button labels.
    """)

