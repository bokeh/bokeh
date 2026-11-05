#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from typing import Unpack

from bokeh.models.ui.ui_element import UIElement, _UIElementInit

class _NotificationsInit(_UIElementInit, total=False):
    ...

class Notifications(UIElement):
    def __init__(self, **kwargs: Unpack[_NotificationsInit]) -> None: ...
