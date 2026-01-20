#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Unpack

# Bokeh imports
from bokeh.models import UIElement, UIElementInit

class NotificationsInit(UIElementInit, total=False):
    ...

class Notifications(UIElement):
    def __init__(self, **kwargs: Unpack[NotificationsInit]) -> None: ...
