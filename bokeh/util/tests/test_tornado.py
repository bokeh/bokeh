from __future__ import absolute_import, print_function

from tornado import gen
from tornado.ioloop import IOLoop

from bokeh.util.tornado import yield_for_all_futures

@gen.coroutine
def async_value(value):
    yield gen.moment # this ensures we actually return to the loop
    raise gen.Return(value)

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
