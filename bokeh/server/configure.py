#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import logging

from flask import Flask
from six.moves.queue import Queue
import zmq

from .blueprint import bokeh_blueprint
from .settings import Settings
from .zmq import Publisher

from .server_backends import SingleUserAuthentication #, MultiUserAuthentication

def create_flask_app(config=None):
    """Create a a Bokeh Server Flask application"""

    app = Flask('bokeh.server')

    # this is to get the routes defined
    from .views import backbone, bbauth, main, plugins, statics
    backbone, bbauth, main, plugins, statics

    configure_app(app, config)
    configure_logging(app)
    configure_storage(app)
    configure_blueprint(app)

    return app

def configure_app(app, config=None):

    # apply the default/environment var settings
    app.config.from_object(Settings)

    # layer on any customizations (e.g., from argparse)
    if config:
        app.config.from_object(config)

def configure_blueprint(app):
    ctx = zmq.Context()
    app.config['ctx'] = ctx
    bokeh_blueprint.url_prefix = app.config['URL_PREFIX']
    bokeh_blueprint.publisher = Publisher(ctx, app.config['PUB_ZMQADDR'], Queue())
    bokeh_blueprint.setup(
        app.config['backbone_storage'],
        app.config['model_storage'],
        SingleUserAuthentication(),
    )
    app.register_blueprint(bokeh_blueprint, url_prefix=app.config['URL_PREFIX'])

def configure_logging(app):
    level = app.config['LOG_LEVEL']
    logging.basicConfig(level=level, format="%(asctime)s:%(levelname)s:%(name)s:%(message)s")

def configure_storage(app):
    if app.config['STORAGE_BACKEND'] == 'redis':
        import redis
        from .storage.redis import RedisModelStorage, RedisBackboneStorage
        rhost = app.config['REDIS_HOST']
        rport = app.config['REDIS_PORT']
        backbone_storage = RedisBackboneStorage(redis.Redis(host=rhost, port=rport, db=2))
        model_storage = RedisModelStorage(redis.Redis(host=rhost, port=rport, db=3))

    # The storage backends below are just here for convenience of the demo server. Real
    # deployments require the redis backend

    elif app.config['STORAGE_BACKEND'] == 'memory':
        from .storage.in_memory import InMemoryModelStorage, InMemoryBackboneStorage
        backbone_storage = InMemoryBackboneStorage()
        model_storage = InMemoryModelStorage()

    elif app.config['STORAGE_BACKEND'] == 'shelve':
        from .storage.shelve import ShelveModelStorage, ShelveBackboneStorage
        backbone_storage = ShelveBackboneStorage()
        model_storage = ShelveModelStorage()

    app.config['backbone_storage'] = backbone_storage
    app.config['model_storage'] = model_storage