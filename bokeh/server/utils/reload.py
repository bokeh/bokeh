#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import atexit
import os
import sys
import time
import traceback

try:
    from werkzeug._reloader import _iter_module_files
except ImportError:
    # backward compat with old versions of werkzeug
    from werkzeug.serving import _iter_module_files


def broadcast_reload():
    from bokeh.server.app import bokeh_app
    if hasattr(bokeh_app, 'wsmanager'):
        bokeh_app.wsmanager.send('debug:debug', 'reload')

def _wait_for_edit(extra_files=None, interval=1):
    """Waits until one of the files we're using have changed
    """
    from itertools import chain
    mtimes = {}
    while 1:
        for filename in chain(_iter_module_files(), extra_files or ()):
            try:
                mtime = os.stat(filename).st_mtime
            except OSError:
                continue
            old_time = mtimes.get(filename)
            if old_time is None:
                mtimes[filename] = mtime
                continue
            elif mtime > old_time:
                return
        time.sleep(interval)

def robust_reloader(func):
    def wrapper(*args, **kwargs):
        atexit.register(broadcast_reload)
        try:
            print ('running robust reloader')
            func(*args, **kwargs)
        except KeyboardInterrupt:
            raise
        except Exception:
            """If in robust reload mode, gather all dependent files
            and wait until something has changed - and if so,
            exit(3) (that's what werkzeug looks for to determine
            whether or not to reload)
            """
            extra_files = []
            traceback.print_exc()
            exc_type, exc_value, exc_tb = sys.exc_info()
            tb = exc_tb
            while tb:
                filename = tb.tb_frame.f_code.co_filename
                extra_files.append(filename)
                tb = tb.tb_next
            if isinstance(exc_value, SyntaxError):
                extra_files.append(exc_value.filename)
            print ('wait for edit')
            _wait_for_edit(extra_files=extra_files)
            sys.exit(3)
    return wrapper
