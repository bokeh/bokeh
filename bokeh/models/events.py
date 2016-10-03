""" Module for specifying event handling

"""
from __future__ import absolute_import

from ..model import Model
from ..core.properties import Instance

from .callbacks import Callback

class UIEvents(Model):
    """
    Interface for adding callbacks to UI events
    """

    on_tap = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_doubletap = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_press = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_pan_start = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_pan = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_pan_end = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_pinch_start = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_pinch = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_pinch_end = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_rotate_start = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_rotate = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_rotate_end = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_mouse_enter = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_mouse_move = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_mouse_exit = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_mouse_wheel = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_key_down = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)

    on_key_up = Instance(Callback, help="""
    A client-side action specification, like opening a URL, showing
    a dialog box, etc. See :class:`~bokeh.models.actions.Action` for details.
    """)
