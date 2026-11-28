#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license text is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Origin of an incoming document patch. '''

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..client.session import ClientSession
    from ..server.connection import ServerConnection
    from ..server.session import ServerSession


@dataclass(frozen=True)
class Setter:
    session: ClientSession | ServerSession
    connection: ServerConnection | None = None
