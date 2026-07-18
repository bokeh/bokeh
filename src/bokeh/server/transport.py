#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Framework-neutral transport protocols for Bokeh server connections. '''

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Protocol

if TYPE_CHECKING:
    from ..protocol.message import Message

__all__ = ()

class WebSocketTransport(Protocol):
    async def send_message(self, message: Message[Any]) -> None: ...

    def ping(self, data: bytes) -> None: ...
