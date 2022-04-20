
import contextlib
import sys
import os
import subprocess
import requests_unixsocket
import requests
import socket


cmd = [
    sys.executable,
    "server.py"
]   

if os.path.exists("test.socket"):
    os.remove("test.socket")

sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
sock.bind("test.socket")

@contextlib.contextmanager
def run_server(args):
    # cmd = [sys.executable, "-m", "bokeh", "serve"] + args
    cmd = args
    print(cmd)
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=False)
    nbsr = p.stdout
    try:
        yield p, nbsr
    except Exception as e:
        p.terminate()
        p.wait()
        print("An error occurred: %s", e)
        try:
            out = p.stdout.read().decode()
            print("\n---- subprocess stdout follows ----\n")
            print(out)
        except Exception:
            pass
        raise
    else:
        p.terminate()
        p.wait()

with run_server(cmd) as (p, x):
    import time
    time.sleep(0.5)
    with requests_unixsocket.monkeypatch():
        r = requests.get('http+unix://test.socket/')
        print(r.status_code)