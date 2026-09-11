from random import random
from threading import Event, Thread

from bokeh.models import ColumnDataSource
from bokeh.plotting import curdoc, figure

source = ColumnDataSource(data=dict(x=[0.0], y=[0.0]))
doc = curdoc()
stop = Event()


def start_producer() -> None:
    @doc.locked_callback(policy="latest")
    def update(x: float, y: float) -> None:
        source.stream(dict(x=[x], y=[y]), rollover=100)

    def produce_data() -> None:
        while not stop.wait(0.05):
            # This function may block or be called by an external library. The
            # decorated callback schedules the model update with the document lock.
            update(random(), random())

    Thread(target=produce_data, daemon=True).start()


def session_destroyed(session_context) -> None:
    stop.set()


plot = figure(x_range=(0, 1), y_range=(0, 1), height=350)
plot.scatter(x="x", y="y", source=source, size=10)

doc.add_root(plot)
doc.on_session_destroyed(session_destroyed)
doc.add_next_tick_callback(start_producer)
