import tornado.ioloop
import tornado.web
from tornado.httpserver import HTTPServer
from tornado.options import options, define
from tornado.netutil import bind_unix_socket

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")
 
application = tornado.web.Application([
    (r"/", MainHandler),
])
 
if __name__ == "__main__":
    server = HTTPServer(application)
    socket = bind_unix_socket("/home/dell/Desktop/OpenSourceProjects/bokeh/tests/unit/bokeh/command/subcommands/test.socket")
    server.add_socket(socket)
    tornado.ioloop.IOLoop.instance().start()