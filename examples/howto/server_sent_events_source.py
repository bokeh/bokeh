import numpy as np
import json
from time import sleep
from flask import Flask, jsonify, make_response, request, Response

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

source = ServerSentDataSource(data_url='http://localhost:5050/data',
                              mode='append', method='GET', adapter=adapter)

p = figure(plot_height=300, plot_width=800, background_fill_color="lightgrey",
           title="Streaming Noisy sin(x) via Ajax")
p.circle('x', 'y', source=source)

p.x_range.follow = "end"
p.x_range.follow_interval = 10

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
        t = 0
        while True:
          t = t + 0.1
          v = np.sin(t)
          yield "data: "+json.dumps([[t, v]])+"\n\n"
          sleep(0.02)
    resp = Response(event_stream(), mimetype="text/event-stream")
    resp.headers['Cache-Control'] = 'no-cache'
    return resp

# show and run

output_file("plot.html", title='Bokeh Plot', mode='inline')
show(p)
app.run(port=5050)
