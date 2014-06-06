from __future__ import print_function
import subprocess

command = 'git describe'
child = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


vers,err = child.communicate()

#needed for py3/py2
vers = vers.decode(encoding='utf-8')
vers = vers.split('-')[0]
vals = vers.split('.')

#check for X.X and increment to X.X.1
if len(vals) < 3:
    new_ver = '.'.join(vals) + '.1'

    print(new_ver)
else:
    new_val = int(vals[-1])+1
    new_val = str(new_val)
    vals[-1] = new_val
    new_ver = '.'.join(vals)
    print(new_ver)