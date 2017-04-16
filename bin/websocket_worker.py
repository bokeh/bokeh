#!/usr/bin/env python
import argparse
from bokeh.server.websocket import make_app
import logging

def build_parser():
    parser = argparse.ArgumentParser(description="start bokeh websocket")
    parser.add_argument("--url-prefix",
                        help="url prefix",
                        type=str,
                        default=None
                        )
    parser.add_argument("--zmqaddr",
                        help="zmq url",
                        action='append'
    )
    parser.add_argument("--ws-port",
                        help="port for websocket worker",
                        default=5007,
                        type=int
    )
    return parser
def run_args(args):
    #dont' know how to do default args with append and argparse
    if args.zmqaddr is None:
        args.zmqaddr = ["tcp://127.0.0.1:5007"]
    app = make_app(args.url_prefix, args.zmqaddr, args.ws_port)
    try:
        app.start()
    finally:
        app.stop()

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    parser = build_parser()
    args = parser.parse_args()
    run_args(args)
