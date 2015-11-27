
import os
import sys

from bokeh.application import Application
from bokeh.application.handlers import ScriptHandler, DirectoryHandler

def die(message):
    print(message, file=sys.stderr)
    sys.exit(1)

def build_applications(files):
    applications = {}

    for file in files:
        file = os.path.abspath(file)
        if os.path.isdir(file):
            handler = DirectoryHandler(filename=file)
        else:
            handler = ScriptHandler(filename=file)

        if handler.failed:
            die("Error loading %s:\n\n%s\n%s " % (file, handler.error, handler.error_detail))

        application = Application()
        application.add(handler)

        route = handler.url_path()
        if not route:
            if '/' in applications:
                die("Don't know the URL path to use for %s" % (file))
            route = '/'
        applications[route] = application

    if len(applications) == 0:
        # create an empty application by default, used with output_server typically
        applications['/'] = Application()

    return applications
