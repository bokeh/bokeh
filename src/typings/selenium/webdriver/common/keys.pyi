# Standard library imports
from collections.abc import Sequence

from typing_extensions import TypeAlias

_KeySeq: TypeAlias = str | int | Sequence[str]

class Keys:
    NULL: str
    CANCEL: str
    HELP: str
    BACKSPACE: str
    BACK_SPACE: str
    TAB: str
    CLEAR: str
    RETURN: str
    ENTER: str
    SHIFT: str
    LEFT_SHIFT: str
    CONTROL: str
    LEFT_CONTROL: str
    ALT: str
    LEFT_ALT: str
    PAUSE: str
    ESCAPE: str
    SPACE: str
    PAGE_UP: str
    PAGE_DOWN: str
    END: str
    HOME: str
    LEFT: str
    ARROW_LEFT: str
    UP: str
    ARROW_UP: str
    RIGHT: str
    ARROW_RIGHT: str
    DOWN: str
    ARROW_DOWN: str
    INSERT: str
    DELETE: str
    SEMICOLON: str
    EQUALS: str

    NUMPAD0: str
    NUMPAD1: str
    NUMPAD2: str
    NUMPAD3: str
    NUMPAD4: str
    NUMPAD5: str
    NUMPAD6: str
    NUMPAD7: str
    NUMPAD8: str
    NUMPAD9: str
    MULTIPLY: str
    ADD: str
    SEPARATOR: str
    SUBTRACT: str
    DECIMAL: str
    DIVIDE: str

    F1: str
    F2: str
    F3: str
    F4: str
    F5: str
    F6: str
    F7: str
    F8: str
    F9: str
    F10: str
    F11: str
    F12: str

    META: str
    COMMAND: str
