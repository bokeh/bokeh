'''This example demonstrates embedding in an iframe using srcdoc under restrictive CSP.

To view the example, run:

    python main.py

in this directory, and navigate to:

    http://localhost:5000

'''
import atexit
import subprocess

from flask import Flask, render_template_string

from bokeh.client import pull_session
from bokeh.embed.server import server_html_page_for_session
from bokeh.resources import INLINE

app_html = """
<!DOCTYPE html>
<html lang="en">
  <body>
    <p>
      This is an example of cross-origin embedding using an iframe under restrictive Content Security Policy (CSP).
      Under strict CSP iframe embedding with `src` does not work:
    </p>
    <iframe src="{{ app_url }}" width=100% height=50px></iframe>
    <p>But it is still possible to embed with `srcdoc` attribute and using `data-absolute-url`:</p>
    <iframe id="myiframe" width=100% height=500px></iframe>
  <script>
    const iframe = document.querySelector("#myiframe");
    iframe.dataset.absoluteUrl = {{ app_url|tojson }};
    iframe.srcdoc = {{ code|tojson }};
  </script>
  </body>
</html>
"""

app = Flask(__name__)

bokeh_process = subprocess.Popen(
    ['python', '-m', 'bokeh', 'serve', '--port=5151', '--allow-websocket-origin=localhost:5000', '--allow-websocket-origin=127.0.0.1:5000', 'bokeh_server.py'],
    stdout=subprocess.PIPE,
)

@atexit.register
def kill_server():
    bokeh_process.kill()


@app.after_request
def add_security_headers(resp):
    resp.headers["Content-Security-Policy"] = "frame-ancestors 'none'"
    return resp

@app.route('/')
def home():
    app_url = "http://localhost:5151/bokeh_server"
    with pull_session(url=app_url) as session:
        code = server_html_page_for_session(session=session, resources=INLINE, title='test')
    return render_template_string(app_html, code=code, app_url=app_url)


if __name__ == '__main__':
    app.run()
