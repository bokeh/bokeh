from tornado.locks import Condition
from tornado import gen
import time
import random
from collections import deque

# Lets say we have some asynchronous process generating data
# and placing that data into a fixed-length buffer

buffer = deque(maxlen=10)
condition = Condition()

@gen.coroutine
def f():
    while True:
        yield gen.sleep(random.random() / 10)  # sleep for a random amount of time
        data = random.random()                 # random data
        now = time.time()
        buffer.append((now, data))
        condition.notify_all()                 # inform everyone that new data has arrived

# Lets run this coroutine on a Tornado event loop
# We won't start the event loop yet though,
# We'll add Bokeh to the same event loop in a momnet

from tornado.ioloop import IOLoop

io_loop = IOLoop.current()
io_loop.add_callback(f)


# Now we make a Bokeh Server application to render this data

from bokeh.plotting import figure, ColumnDataSource
from bokeh.server.server import Server

def make_bokeh_page(doc):
    source = ColumnDataSource({'time': [], 'value': []})

    fig = figure(x_axis_type='datetime')
    fig.line(x='time', y='value', source=source)

    doc.add_root(fig)

    @gen.coroutine
    def update():
        last_time = 0
        while True:
            yield condition.wait()
            time, value = buffer[-1]  # get most recent value in buffer
            d = {'time': [time], 'value': [value]}

            # Add value to source when safe to do so
            doc.add_next_tick_callback(lambda: source.stream(d, 1000))

    io_loop.add_callback(update)

server = Server({'/': make_bokeh_page}, io_loop=io_loop)
server.start()

# Now we start everything going
io_loop.start()


"""
Some opportunites for improvement
---------------------------------

1.  The update coroutine per document never gets cleaned up.
    Ideally we would check the document to see if it is still alive and break
    if it wasn't
2.  The doc.add_next_tick_callback(lambda: source.stream ...) code is ugly.
    Ideally it would be safe to touch Bokeh structures at any time in the event
    loop.  As it is Bokeh uses Tornado Locks to say when it is safe.
3.  The logic and plot could be improved, but other people are probably better
    suited to that than I
"""
