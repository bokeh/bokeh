import subprocess
import os
from os.path import join, dirname
from continuumweb.launch_process import ManagedProcess
import sys

def start_redis(pidfilename, port, data_dir, data_file='redis.db', save=True):
    base_config = os.path.join(os.path.dirname(__file__), 'redis.conf')
    with open(base_config) as f:
        redisconf = f.read()
    savestr = ''
    if save: savestr = 'save 10 1'
    redisconf = redisconf % {'port' : port,
                             'dbdir' : data_dir,
                             'dbfile' : data_file,
                             'save' : savestr}
    mproc = ManagedProcess(['redis-server', '-'], 'redis', pidfilename,
                           stdout=sys.stdout,
                           stderr=sys.stderr
                           )
    mproc.proc.stdin.write(redisconf)
    mproc.proc.stdin.close()
    return mproc
