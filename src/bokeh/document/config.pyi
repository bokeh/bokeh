#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
# Bokeh imports
from ..core.enums import ColorSchemeType
from ..model import Model
from ..models.i18n.i18n import I18n
from ..models.ui.notifications import Notifications

class DocumentConfig(Model):

    reconnect_session: bool = ...

    notify_connection_status: bool = ...

    notifications: Notifications | None = ...

    color_scheme: ColorSchemeType = ...

    i18n: I18n = ...
