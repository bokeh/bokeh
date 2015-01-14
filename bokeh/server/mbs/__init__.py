## multi user blaze server code.  This module contains extra routes for the blaze
## data backend

import warnings
import logging

logger = logging.getLogger(__name__)

def get_blueprint(config_file=None):
    retval = None
    try:
        from . import views
        import mbs.app
        retval = mbs.app.mbsbp
        mbs.app.setup_app(config_file=config_file)
    except ImportError as e:
        logger.exception(e)
        warnings.warn("could not import multiuser blaze server")
    else:
        return retval
