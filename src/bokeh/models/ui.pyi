from dataclasses import dataclass

from ..core.enums import (
    ToolIconType as ToolIcon,
)
from ..model import Model
from .callbacks import Callback

@dataclass(init=False)
class DOMNode(Model):
    ...
@dataclass
class Node(Model):
    ...
@dataclass
class Styles(Model):
    ...
@dataclass
class StyleSheet(Model):
    ...

@dataclass(init=False)
class StyledElement(Model):

    css_classes: list[str] = ... # TODO Seq(String)

    css_variables: dict[str, Node] = ...

    styles: dict[str, str | None] | Styles = ...

    stylesheets: list[StyleSheet | str | dict[str, dict[str, str | None] | Styles]] = ...

@dataclass(init=False)
class UIElement(StyledElement):

    visible: bool = ...

    context_menu: Menu | None = ...

@dataclass
class Pane(UIElement):

    elements: list[UIElement | DOMNode] = ...

@dataclass(init=False)
class MenuItem(Model):
    ...

@dataclass
class ActionItem(MenuItem):

    icon: Image | ToolIcon | str | None

    label: str = ... # TODO Required(String)

    shortcut: str | None = ...

    menu: Menu | None = ...

    tooltip: str | None = ...

    disabled: bool = ...

    action: Callback | None = ...

@dataclass
class CheckableItem(ActionItem):

    checked: bool = ...

@dataclass
class DividerItem(MenuItem):
    ...

@dataclass
class Menu(UIElement):

    items: list[MenuItem] = ...

    reversed: bool = ...
