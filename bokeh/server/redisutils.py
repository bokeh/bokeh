import subprocess
import os

def start_redis(port, data_dir, data_file='redis.db', log_file='redis.log', save=True):
    base_config = os.path.join(os.path.dirname(__file__), 'redis.conf')
    log_file = open(os.path.join(data_dir, log_file), 'w+')
    with open(base_config) as f:
        redisconf = f.read()
    savestr = ''
    if save: savestr = 'save 10 1'
    redisconf = redisconf % {'port' : port,
                             'dbdir' : data_dir,
                             'dbfile' : data_file,
                             'save' : savestr}
    proc = subprocess.Popen(['redis-server', '-'],
                            stdout=log_file,
                            stdin=subprocess.PIPE,
                            stderr=log_file)
    proc.stdin.write(redisconf)
    proc.stdin.close()
    return proc
                     

class RedisProcess(object):
    def __init__(self, port, data_dir, data_file='redis.db',
                 log_file='redis.log', save=True):
        self.proc = start_redis(port, data_dir,
                                data_file=data_file,
                                log_file=log_file,
                                save=save)
        self.closed = False
        
    def close(self):
        self.proc.kill()
        self.proc.communicate()
        self.closed = True

    def __del__(self):
        if not self.closed:
            self.close()
