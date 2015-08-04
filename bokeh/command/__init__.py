from __future__ import print_function

import argparse
import os
import time
import sys

from bokeh.settings import settings
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from .server import Server

def die(message):
    print(message, file=sys.stderr)
    sys.exit(1)

class Subcommand(object):
    """Abstract base class for subcommands"""

    def __init__(self, parser):
        """Initialize the subcommand with its parser; can call parser.add_argument to add subcommand flags"""
        self.parser = parser

    def func(self, args):
        """Takes over main program flow to perform the subcommand"""
        pass

class FileChangeHandler(FileSystemEventHandler):
    def __init__(self, server):
        self.server = server

    def on_any_event(self, event):
        #print("file event: " + repr(event))
        #print("event_type: " + event.event_type)
        #print("src_path: " + event.src_path)
        if event.event_type == "modified":
            self.server.file_modified(event.src_path)
        elif event.event_type == "created" or event.event_type == "deleted":
            self.server.file_modified(event.src_path)
        elif event.event_type == "moved":
            self.server.file_modified(event.dest_path)

def current_time():
    import datetime
    return datetime.datetime.now()

class LocalServer(Subcommand):
    """Abstract base class for subcommands that launch a single-user local server"""

    def __init__(self, **kwargs):
        super(LocalServer, self).__init__(**kwargs)
        self.parser.add_argument('--port', metavar='PORT', type=int, help="Port to listen on", default=-1)
        self.parser.add_argument('directory', nargs='?',  metavar='APPDIR', help="The app directory (current directory if not specified)",
                                 default=os.getcwd())
        self.port = 5006
        self.develop_mode = False
        self.server = None
        self.app_module = None

    def load(self, src_path):
        import ast
        from types import ModuleType
        source = open(src_path, 'r').read()
        nodes = ast.parse(source, src_path)
        code = compile(nodes, filename=src_path, mode='exec')
        self.app_module = ModuleType(self.appname)
        exec(code, self.app_module.__dict__)

    def refresh(self, open_browser):
        from bokeh.io import curdoc

        curdoc().context.develop_shell.error_panel.error = ""
        curdoc().context.develop_shell.error_panel.error_detail = ""
        curdoc().context.develop_shell.error_panel.visible = False
        curdoc().context.develop_shell.reloading.visible = True
        self.server.push(curdoc())
        started_load = current_time()

        # TODO rather than clearing curdoc() we'd ideally
        # save the old one and compute a diff to send.
        curdoc().clear()
        error = ""
        error_detail = ""
        try:
            self.load(self.mainpy)
        except SyntaxError, e:
            import traceback
            formatted = traceback.format_exc(e)

            error = "Invalid syntax in \"%s\" on line %d:\n%s" % (os.path.basename(e.filename), e.lineno, e.text)
            error_detail = formatted
        except Exception, e:
            import traceback
            formatted = traceback.format_exc(e)

            exc_type, exc_value, exc_traceback = sys.exc_info()
            filename, line_number, func, txt = traceback.extract_tb(exc_traceback)[-1]

            error = "%s\nFile \"%s\", line %d, in %s:\n%s" % (str(e), os.path.basename(filename), line_number, func, txt)
            error_detail = formatted

        curdoc().context.develop_shell.error_panel.error = error
        curdoc().context.develop_shell.error_panel.error_detail = error_detail
        curdoc().context.develop_shell.error_panel.visible = len(error) > 0

        curdoc().context.develop_shell.reloading.visible = False

        ended_load = current_time()
        elapsed = ended_load - started_load
        if elapsed.total_seconds() < 0.8:
            # this is so the progress spinner is at least briefly visible
            import time
            time.sleep(0.4)

        self.server.push(curdoc())

        if open_browser:
            from bokeh.browserlib import get_browser_controller
            controller = get_browser_controller()
            controller.open(self.server.document_link(curdoc()), new='window')

    def file_modified(self, path):
        # TODO rather than ignoring file changes in prod mode,
        # don't even watch for them
        if self.develop_mode and path == self.mainpy:
            self.refresh(open_browser=False)
        else:
            print("Ignoring change to " + path + " expecting " + self.mainpy)

    def func(self, args):

        self.directory = args.directory
        self.mainpy = os.path.join(self.directory, "main.py")

        if not os.path.exists(self.mainpy):
            die("No 'main.py' found in %s." % (self.directory))

        # this allows apps to refer to relative files in their directory,
        # but it prohibits multiple apps in the same process...
        # it might be better eventually to offer an API for apps to get their
        # directory path from.
        os.chdir(self.directory)

        self.appname = os.path.basename(self.directory)

        if self.directory not in sys.path:
            print("adding %s to python path" % self.directory)
            sys.path.append(self.directory)

        if args.port >= 0:
            self.port = args.port
        if self.develop_mode:
            print("Starting %s in development mode on port %d" % (self.appname, self.port))
        else:
            print("Starting %s in production mode on port %d" % (self.appname, self.port))

        event_handler = FileChangeHandler(self)
        observer = Observer()
        observer.schedule(event_handler, self.directory, recursive=True)
        observer.start()

        self.server = Server(port=self.port, appname=self.appname)

        self.refresh(open_browser=True)

        try:
            self.server.waitFor()
        except KeyboardInterrupt:
            self.server.stop()
        observer.stop()
        observer.join()

class Develop(LocalServer):
    name = "develop"
    help = "Run a Bokeh server in developer mode"

    def __init__(self, **kwargs):
        super(Develop, self).__init__(**kwargs)
        self.develop_mode = True

class Run(LocalServer):
    name = "run"
    help = "Run a Bokeh server in production mode"

    def __init__(self, **kwargs):
        super(Run, self).__init__(**kwargs)

subcommands = [Develop, Run]

def main(argv):
    parser = argparse.ArgumentParser(prog=argv[0])
    # does this get set by anything other than BOKEH_VERSION env var?
    version = settings.version()
    if not version:
        version = "unknown version"
    parser.add_argument('-v', '--version', action='version', version=version)
    subs = parser.add_subparsers(help="Sub-commands")
    for klass in subcommands:
        c_parser = subs.add_parser(klass.name, help=klass.help)
        c = klass(parser=c_parser)
        c_parser.set_defaults(func=c.func)

    args = parser.parse_args(argv[1:])
    args.func(args)
