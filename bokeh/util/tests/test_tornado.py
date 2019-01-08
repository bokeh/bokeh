#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
from tornado import gen
from tornado.ioloop import IOLoop

# Bokeh imports

# Module under test
from bokeh.util.tornado import yield_for_all_futures

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

@gen.coroutine
def async_value(value):
    yield gen.moment # this ensures we actually return to the loop
    raise gen.Return(value)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__yield_for_all_futures():
    loop = IOLoop()
    loop.make_current()

    @gen.coroutine
    def several_steps():
        value = 0
        value += yield async_value(1)
        value += yield async_value(2)
        value += yield async_value(3)
        raise gen.Return(value)

    result = {}
    def on_done(future):
        result['value'] = future.result()
        loop.stop()

    loop.add_future(yield_for_all_futures(several_steps()),
                    on_done)

    try:
        loop.start()
    except KeyboardInterrupt:
        print("keyboard interrupt")

    assert 6 == result['value']

    loop.close()

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
