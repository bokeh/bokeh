#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from bokeh.models.ui.ui_element import UIElement

from ...core.enums import AutoType as Auto
from ...model.model import JSEventCallback
from ..css import StyleSheet
from ..css import Styles
from ..nodes import Node
from .menus import Menu
from typing import Any
from typing import Sequence
from typing import TypedDict

class _NotificationsInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    html_attributes: dict[str, str]
    html_id: str | None
    css_classes: Sequence[str]
    css_variables: dict[str, str | Node]
    styles: dict[str, str | None] | Styles
    stylesheets: list[StyleSheet | str | dict[str, dict[str, str | None] | Styles]]
    visible: bool
    context_menu: Menu | Auto | None

class Notifications(UIElement):
    def __init__(self, **kwargs: Unpack[_NotificationsInit]) -> None: ...
