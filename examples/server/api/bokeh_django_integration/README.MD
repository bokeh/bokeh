# Django Bokeh Integration Example

## Requirement
The following packages are used in this example:
* `Bokeh == 3.0.3`
* `Django == 4.1.5`
* `Tornado == 6.2`

## Description
The server can be run with 

`python manage.py runserver`

The Bokeh python callback can work properly so you can manipulate your data with python code in callbacks.

The concept is to 

1. Start a bokeh server with `bk_worker()` function and the thread with `Thread(target=bk_worker).start()`. 
2. The django page will host the server content.
3. If you need to modify the Bokeh content based on request, simply pass your parameters with the `arguments` parameter and it will be received by the bokeh server by `doc.session_context.request.arguments`.
4. The socket check is to make sure the server won't be started twice on the same port.
5. The `allow_websocket_origin=["127.0.0.1:8000"]` needs to be changed if your Django is hosted at different url and port.