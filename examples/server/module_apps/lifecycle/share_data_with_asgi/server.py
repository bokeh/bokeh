import asyncio
from contextlib import suppress

from bokeh.server.asgi import BokehASGI
from examples.server.module_apps.updating_data.share_data_between_sessions.app import (
    modify_document,
)

from .producer import produce, report_producer_failure

bokeh_application = BokehASGI(modify_document)


async def app(scope, receive, send):
    if scope["type"] != "lifespan":
        await bokeh_application(scope, receive, send)
        return
    producer = None
    while True:
        event = await receive()
        if event["type"] == "lifespan.startup":
            try:
                await bokeh_application.core.start()
                producer = asyncio.create_task(produce(bokeh_application))
                producer.add_done_callback(report_producer_failure)
            except Exception as error:
                await send({"type": "lifespan.startup.failed", "message": str(error)})
                return
            await send({"type": "lifespan.startup.complete"})
        elif event["type"] == "lifespan.shutdown":
            try:
                try:
                    if producer is not None:
                        producer.cancel()
                        with suppress(asyncio.CancelledError):
                            await producer
                finally:
                    await bokeh_application.core.stop()
            except Exception as error:
                await send({"type": "lifespan.shutdown.failed", "message": str(error)})
                return
            await send({"type": "lifespan.shutdown.complete"})
            return
