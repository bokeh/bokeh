from flask import Flask, render_template

from bokeh.client import pull_session
from bokeh.embed import embed_server

app_url = "http://localhost:5100/bokeh_app"

app = Flask(__name__)

@app.route('/')
def bkapp_page():

    # pull a new session from running Bokeh server
    with pull_session(url=app_url) as session:

        # update or customize that session
        session.document.roots[0].title.text = "Special Plot Title For A Specific User!"

        # generate markup to load the customized session
        result = embed_server(app_url, session_id=session.id)
        script = result.fragment(resources="server").html

        # use the script in the rendered page
        return render_template("embed.html", script=script, template="Flask")

if __name__ == '__main__':
    app.run(port=8080)
