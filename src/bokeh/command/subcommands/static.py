#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from argparse import Namespace

from bokeh.settings import settings
from bokeh.util.logconfig import basicConfig

# Bokeh imports
from ...server.asgi import BokehASGI
from ..subcommand import Subcommand
from ..util import report_server_init_errors
from .serve import base_serve_args

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Static',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Static(Subcommand):
    ''' Subcommand to launch the Bokeh static server. '''

    #: name for this subcommand
    name = "static"

    help = "Serve bokehjs' static assets (JavaScript, CSS, images, fonts, etc.)"

    args = base_serve_args

    def invoke(self, args: Namespace) -> None:
        '''

        '''
        basicConfig(format=args.log_format, filename=args.log_file)

        # This is a bit of a fudge. We want the default log level for non-server
        # cases to be None, i.e. we don't set a log level. But for the server we
        # do want to set the log level to INFO if nothing else overrides that.
        log_level = settings.py_log_level(args.log_level)
        if log_level is None:
            log_level = logging.INFO
        logging.getLogger('bokeh').setLevel(log_level)

        if args.use_config is not None:
            log.info(f"Using override config file: {args.use_config}")
            settings.load_config(args.use_config)

        from ...server.host import serve

        application = BokehASGI({}, use_index=False)
        with report_server_init_errors(address=args.address, port=args.port):
            serve(application, address=args.address, port=args.port, unix_socket=args.unix_socket)
