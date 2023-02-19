""" Demonstration of how to register document JS event callbacks. """

from bokeh.events import Event
from bokeh.io import curdoc
from bokeh.models import Button, CustomJS


def py_ready(event: Event):
    print("READY!")

js_ready = CustomJS(code="""
const html = "<div>READY!</div>"
document.body.insertAdjacentHTML("beforeend", html)
""")

curdoc().on_event("document_ready", py_ready)
curdoc().js_on_event("document_ready", js_ready)

def py_connection_lost(event: Event):
    print("CONNECTION LOST!")

js_connection_lost = CustomJS(code="""
const html = "<div>DISCONNECTED!</div>"
document.body.insertAdjacentHTML("beforeend", html)
""")

curdoc().on_event("connection_lost", py_connection_lost)
curdoc().js_on_event("connection_lost", js_connection_lost)

def py_clicked(event: Event):
    print("CLICKED!")

js_clicked = CustomJS(code="""
const html = "<div>CLICKED!</div>"
document.body.insertAdjacentHTML("beforeend", html)
""")

button = Button(label="Click me")
button.on_event("button_click", py_clicked)
button.js_on_event("button_click", js_clicked)

curdoc().add_root(button)
