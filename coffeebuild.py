import subprocess
import sys
import time

projects = {
    'bokeh':{
        'input' : 'bokeh/server/static/coffee',
        'output' : 'bokeh/server/static/js',
        },
    'bokehjs':{
        'input' : 'subtree/bokehjs/static/coffee',
        'output' : 'subtree/bokehjs/static/js',
        },
    'bokehjstest':{
        'input' : 'subtree/bokehjs/static/coffee/unittest',
        'output' : 'subtree/bokehjs/static/js/unittest',
        }
    }

def build(inputdir, outputdir):
    command = "coffee --compile --output %s %s"
    command = command %(outputdir, inputdir)
    print command
    proc = subprocess.Popen(command, shell=True,
                            stdout=subprocess.PIPE,
                            stdin=subprocess.PIPE)
    data = proc.communicate()
    print data[0]
    print data[1]

def build_all():
    for project in projects:
        inputs = projects[project]['input']
        outputs = projects[project]['output']
        build(inputs, outputs)

if __name__ == "__main__":
    """
    usage:
    python coffeebuild.py watch - builds all projects once
    """
    build_all()
