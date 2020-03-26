#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json
import time
import subprocess
import pty
import os
import signal
import platform

# External imports

# Bokeh imports
from bokeh.embed import json_item
from bokeh.models import Plot
from bokeh.resources import INLINE

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
    "bokeh._testing.plugins.selenium",
)

is_windows = platform.system() == "Windows"

CMD=["examples/howto/server_embed/django_embed/manage.py", "runserver"]

@pytest.mark.selenium
class Test_json_item(object):

    def test_bkroot_added_to_target(self, driver) -> None:
        try:
            class Timeout(Exception):
                pass

            if not is_windows:
                def alarm_handler(sig, frame):
                    raise Timeout

                signal.signal(signal.SIGALRM, alarm_handler)
                signal.alarm(10)

            start = time.time()
            try:
                subprocess.Popen([CMD[0]] + ["migrate"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

                master, slave = pty.openpty()
                proc = subprocess.Popen(CMD, stdout=slave, stderr=slave, close_fds=True)
                while True:
                    s = os.read(master, 16384)
                    if 'CONTROL-C' in str(s): break
            except Timeout:
                proc.terminate()
            finally:
                if not is_windows:
                    signal.alarm(0)

            driver.get("http://127.0.0.1:8000/sea_surface/")

            div = driver.find_elements_by_class_name("bk-root")

            proc.terminate()

            assert len(div) == 1, "page source:\n\n" + str(driver.page_source) + "\n\njavascript console:\n\n" + "\n".join([str(s) for s in driver.get_log('browser')])
        except KeyboardInterrupt:
            proc.terminate()
