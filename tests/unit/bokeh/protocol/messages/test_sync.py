#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

from bokeh.protocol import sync


def test_sync() -> None:
    message = sync()

    assert message.msgtype == "SYNC"
    assert message.content == {}
    assert "reqid" not in message.header
