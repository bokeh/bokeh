import numpy as np
from flask import Flask, jsonify, make_response, request

from bokeh.plotting import figure, show
from bokeh.models import AjaxDataSource, CustomJS

# Bokeh related code

adapter = CustomJS(code="""
    const result = {x: [], y: []}
    const pts = cb_data.response.points
    for (i=0; i<pts.length; i++) {
        result.x.push(pts[i][0])
        result.y.push(pts[i][1])
    }
    return result
""")

source = AjaxDataSource(data_url='http://localhost:5050/data',
                        polling_interval=100, adapter=adapter)

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

x = list(np.arange(0, 6, 0.1))
y = list(np.sin(x) + np.random.random(len(x)))

@app.route('/data', methods=['GET', 'OPTIONS', 'POST'])
@crossdomain
def data():
    x.append(x[-1]+0.1)
    y.append(np.sin(x[-1])+np.random.random())
    return jsonify(points=list(zip(x,y)))

# show and run

show(p)
app.run(port=5050)
