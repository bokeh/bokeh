'''Packaged frontend assets for Bokeh notebook integration.'''

from __future__ import annotations

from typing import Any


def _jupyter_server_extension_points() -> list[dict[str, str]]:
    return [{"module": "bokeh.jupyter"}]


def _load_jupyter_server_extension(serverapp: Any) -> None:
    '''Enable Bokeh's extension in a running Jupyter Server.

    Args:
        serverapp: The Jupyter Server application to extend.

    Returns:
        None

    '''
    from .server import load_jupyter_server_extension

    load_jupyter_server_extension(serverapp)
