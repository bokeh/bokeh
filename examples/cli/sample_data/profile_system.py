""" This is a simple script to support bokeh CLI examples. It writes system
CPUs and Memory information to the file sys_stats.csv every 0.3 seconds.

"""
import datetime as dt
import psutil
import time
import os
here = os.path.dirname(os.path.realpath(__file__))
filepath = os.path.join(here, 'sys_stats.csv')

def using():
    now = dt.datetime.now()
    mem = psutil.virtual_memory()
    cpus = ','.join(str(x) for x in psutil.cpu_percent(interval=0.3, percpu=True))
    return "%s,%s,%s,%s\n" % (now, mem.used, mem.percent, cpus)

# write headers first
cpu_count = ','.join('CPU_%s'%x for x in range(psutil.cpu_count()))
header = 'timestamp,mem_used,mem_perc,%s\n' % cpu_count
with file(filepath, 'w') as f:
    f.write(header)

# loop to register system cpus and memory data
while True:
    with file(filepath, 'a') as f:
        f.write(using())

    time.sleep(0.1)



