import flask
import logging
from logging import Formatter

app = flask.Blueprint('bokeh.server',
                      'bokeh.server',
                      static_folder='static',
                      static_url_path='/bokeh/static',
                      template_folder='templates'
                      )
bokeh_app = app
