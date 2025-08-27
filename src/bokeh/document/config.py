#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" """

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# Bokeh imports
from ..core.properties import (
    Bool,
    Instance,
    InstanceDefault,
    Nullable,
)
from ..model import Model
from ..models.ui.notifications import Notifications

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "DocumentConfig",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class DocumentConfig(Model):
    """ Allows to configure various aspects of the document, its models and the application. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    reconnect_session = Bool(default=True, help="""
    Whether to use the session reconnection logic.

    If enabled, when a session is disconnected, Bokeh will attempt to restore the
    connection. This setting allows to user to completely disable this mechanism.
    """)

    notify_connection_status = Bool(default=True, help="""
    Whether to inform the user about connection status in the UI.

    It may be useful to disable the default notification system in Bokeh, if a
    custom system is being used otherwise.
    """)

    # TODO needs a base class, e.g. NotificationsBase
    notifications = Nullable(Instance(Notifications), default=InstanceDefault(Notifications), help="""
    Allows to configure or replace the notifications UI and logic.
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
