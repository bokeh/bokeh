import subprocess
import sys
import time
from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler

projects = {
    'bokehjs':{
        'input' : 'src/coffee',
        'output' : 'lib/js',
        },
    'bokehjstest':{
        'input' : 'src/test/unittest',
        'output' : 'lib/test/unittest',
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

class MyHandler(PatternMatchingEventHandler):
    def __init__(self, inputs, outputs):
        super(MyHandler, self).__init__(
            patterns=["*.coffee"], case_sensitive=True)
        self.inputs = inputs
        self.outputs = outputs
        
    def on_any_event(self, event):
        if "#" in event.src_path:
            return
        print event
        build(self.inputs, self.outputs)

if __name__ == "__main__":
    """
    usage:
    python build.py build -builds all projects once
    python build.py watch - builds all projects once, then watches for changes.
    """
    if len(sys.argv) >= 2 and  sys.argv[1] == "build":
        build_all()
    else:
        build_all()        
        observer = Observer()        
        for project in projects:
            inputs = projects[project]['input']
            outputs = projects[project]['output']
            event_handler = MyHandler(inputs, outputs)
            print inputs
            observer.schedule(event_handler, path=inputs, recursive=True)
        observer.start()            
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            observer.stop()
        observer.join()
        
            
        
