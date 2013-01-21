import flask
import logging
from logging import Formatter

app = flask.Flask('bokeh.server', static_url_path='/bokeh/static')

app.NODE_INSTALLED = False
#file_handler = logging.FileHandler(lConfig.settings['LOG_FILE'])
