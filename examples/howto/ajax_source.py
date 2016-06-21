import numpy as np
from datetime import timedelta
from functools import update_wrapper, wraps
from math import sin
from random import random
from six import string_types

from bokeh.plotting import figure, show, output_file
from bokeh.models.sources import AjaxDataSource

output_file("ajax_source.html", title="ajax_source.py example")
source = AjaxDataSource(data=dict(x=[], y=[]),
                        data_url='http://localhost:5050/data',
                        polling_interval=100)
p = figure()
p.circle('x', 'y', source=source)

p.x_range.follow = "end"
p.x_range.follow_interval = 10

try:
    from flask import Flask, jsonify, make_response, request, current_app
except ImportError:
    raise ImportError("You need Flask to run this example!")

show(p)

#########################################################
# Flask server related
#
# The following code has no relation to bokeh and it's only
# purpose is to serve data to the AjaxDataSource instantiated
# previously. Flask just happens to be one of the python
# web frameworks that makes it's easy and concise to do so
#########################################################


def crossdomain(origin=None, methods=None, headers=None,
                max_age=21600, attach_to_all=True,
                automatic_options=True):
    """
    Decorator to set crossdomain configuration on a Flask view

    For more details about it refer to:

    http://flask.pocoo.org/snippets/56/
    """
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))

    if headers is not None and not isinstance(headers, string_types):
        headers = ', '.join(x.upper() for x in headers)

    if not isinstance(origin, string_types):
        origin = ', '.join(origin)

    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        @wraps(f)
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            requested_headers = request.headers.get(
                'Access-Control-Request-Headers'
            )
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            elif requested_headers:
                h['Access-Control-Allow-Headers'] = requested_headers
            return resp
        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)

    return decorator

app = Flask(__name__)

x = list(np.arange(0, 6, 0.1))
y = [sin(xx) + random() for xx in x]

@app.route('/data', methods=['GET', 'OPTIONS', 'POST'])
@crossdomain(origin="*", methods=['GET', 'POST'], headers=None)
def hello_world():
    x.append(x[-1]+0.1)
    y.append(sin(x[-1])+random())
    return jsonify(x=x[-500:], y=y[-500:])

if __name__ == "__main__":
    app.run(port=5050)
