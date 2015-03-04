## multi user blaze server code.  This module contains extra routes for the blaze
## data backend

from __future__ import absolute_import

import warnings
import logging

logger = logging.getLogger(__name__)

def get_blueprint(config_file=None):
    retval = None
    try:
        from . import views; views
        import mbs.app
        retval = mbs.app.mbsbp
        mbs.app.setup_app(config_file=config_file)
    except ImportError as e:
        msg = "could not import multiuser blaze server %s.  This is fine if you do not intend to use blaze capabilities in the bokeh server"
        msg = msg % str(e)
        warnings.warn(msg)
    else:
        return retval
