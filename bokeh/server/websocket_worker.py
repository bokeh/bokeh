import argparse

def build_parser():
    parser = argparse.ArgumentParser(description="start bokeh websocket")

def run_args(args):
    pass

def run(backend='threading', redis_connection="redis://localhost:6379?db=4", port=5007, url_prefix="/")
    """run a websocket worker
    Args
        backend : 'threading' or 'redis'
        redis_connection : redis connection string, only used if backend is redis
        port : port to listen on
        url_prefix : url_prefix
    """
