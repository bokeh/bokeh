from threading import Event, Thread

from . import audio

stop = Event()
thread = None


def on_server_loaded(server_context):
    global thread
    stop.clear()
    thread = Thread(target=audio.update_audio_data, args=(stop,), daemon=True)
    thread.start()


def on_server_unloaded(server_context):
    stop.set()
    if thread is not None:
        thread.join(timeout=2)
