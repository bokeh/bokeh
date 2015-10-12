from tornado.httpserver import HTTPServer

from bokeh.application import Application
from bokeh.server.server import Server

import logging
log = logging.getLogger(__name__)

def main():
    # TODO make log level a command line option
    logging.basicConfig(level=logging.DEBUG)
    # TODO we need to fill in Application with handlers,
    # using command line options or config files
    application = Application()
    # TODO allow specifiying multiple applications with routes to each
    applications = { '/' : application }
    server = Server(applications)
    log.info("Starting Bokeh server on port %d", server.port)
    server.start()

if __name__ == "__main__":
    main()
