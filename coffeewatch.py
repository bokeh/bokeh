import subprocess
import sys
import time
from watchdog.events import PatternMatchingEventHandler
import coffeebuild

#we want to use the polling observer for OS X since the others seem buggy
try: # pragma: no cover
    from watchdog.observers.inotify import InotifyObserver as Observer
    print "InotifyObserver"
except ImportError: # pragma: no cover
    try: # pragma: no cover
        from watchdog.observers.fsevents import FSEventsObserver_BUGGY_TODO as Observer
        print "FSEventObserver"
    except ImportError: # pragma: no cover
        from watchdog.observers.polling import PollingObserver as Observer
        print "PollingObserver"

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
        coffeebuild.build(self.inputs, self.outputs)

if __name__ == "__main__":
    """
    usage:
    python coffeewatch.py watch - builds all projects once, then watches for changes.
    """
    coffeebuild.build_all()
    observer = Observer()        
    for project in coffeebuild.projects:
        inputs = coffeebuild.projects[project]['input']
        outputs = coffeebuild.projects[project]['output']
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
        
            
        
