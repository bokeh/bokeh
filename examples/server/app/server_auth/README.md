# Bokeh Authentication Hooks

This examples demonstrates the availability of authentication hooks with the
Bokeh server.

To run, execute the following command:

    bokeh serve --enable-xsrf-cookies --auth-module=auth.py  app.py

Bokeh server authentication hooks are building blocks that can be used by
experienced users to implement any authentication flow they require. This
example is a "toy" example that is only intended to demonstrate how those
building blocks fit together. It should not be used as-is for "production"
use. Users looking for pre-built auth flows that work out of the box should
consider a higher level tool, such as Panel:

    https://panel.holoviz.org/user_guide/Authentication.html
