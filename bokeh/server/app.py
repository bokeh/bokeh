
from .configure import create_flask_app
from .tornado import create_tornado_app

app = create_flask_app()
app.debug = app.config['DEBUG']

def make_tornado():
    return create_tornado_app(app)