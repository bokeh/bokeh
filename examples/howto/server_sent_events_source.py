import numpy as np
import json
from datetime import datetime
from time import sleep
from flask import Flask, make_response, request, Response

from bokeh.plotting import figure, show, output_file
from bokeh.models import ServerSentDataSource, CustomJS

# Bokeh related code

adapter = CustomJS(code="""
    const result = {x: [], y: []}
    const pts = cb_data.response
    for (i=0; i<pts.length; i++) {
        result.x.push(pts[i][0])
        result.y.push(pts[i][1])
    }
    return result
""")

source = ServerSentDataSource(data_url='http://localhost:5050/data', max_size=100,
                              mode='append', adapter=adapter)

p = figure(plot_height=800, plot_width=800, background_fill_color="lightgrey",
           title="Streaming via Server Sent Events", x_range=[-5,5], y_range=[-5,5])
p.circle('x', 'y', source=source)

# Flask related code

app = Flask(__name__)


def crossdomain(f):
    def wrapped_function(*args, **kwargs):
        resp = make_response(f(*args, **kwargs))
        h = resp.headers
        h['Access-Control-Allow-Origin'] = '*'
        h['Access-Control-Allow-Methods'] = "GET, OPTIONS, POST"
        h['Access-Control-Max-Age'] = str(21600)
        requested_headers = request.headers.get('Access-Control-Request-Headers')
        if requested_headers:
            h['Access-Control-Allow-Headers'] = requested_headers
        return resp
    return wrapped_function


@app.route('/data', methods=['GET', 'OPTIONS'])
@crossdomain
def stream():
    def event_stream():
        """No global state used"""
        while True:
            t = datetime.now().timestamp()
            v = np.sin(t*5) + 0.2*np.random.random() + 3
            x = v*np.sin(t)
            y = v*np.cos(t)
            data = [[x, y]]
            yield "data: "+json.dumps(data)+"\n\n"
            sleep(0.1)
    resp = Response(event_stream(), mimetype="text/event-stream")
    resp.headers['Cache-Control'] = 'no-cache'
    return resp

# show and run

output_file("plot.html", title='Bokeh Plot', mode='inline')
show(p)
app.run(port=5050)
