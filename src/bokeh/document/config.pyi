#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Bokeh imports
from ..model import Model
from ..models.ui.notifications import Notifications

class DocumentConfig(Model):

    reconnect_session: bool = ...

    notify_connection_status: bool = ...

    notifications: Notifications | None = ...
