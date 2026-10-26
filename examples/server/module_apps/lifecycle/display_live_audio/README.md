# Display live audio

Display an audio spectrum with application-owned input and cleanup.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.lifecycle.display_live_audio.server:app
```

Open [the application](http://localhost:8000/).
`app.py` creates fresh models in `modify_document(doc)` for each session.
`server.py` supplies the ASGI host configuration.

Additional dependencies: SciPy.

A shared producer starts with the host and stops at shutdown. Without PyAudio,
it produces synthetic audio. Install PyAudio to use an audio input device.

This example compiles a TypeScript extension at startup and requires Node.js.
