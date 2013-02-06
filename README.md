bokehjs
=======

Development
===========
You need to have node.js installed.
clone this repo: https://github.com/ContinuumIO/hem
We're using hem for our build tool, hem will compile coffeescript, 
combine js files, and support node.js require syntax on the client side

install it by executing

`$ sudo npm link` inside the repo.  

This will link hem to your working copy so you get hem changes as we push it out

To run unittests while developing, you need to run 2 processes inside your bokehjs checkout

`$ hem server`
`$ python testserver.py debug`

hem server will compile and serve you js files as you request them.  the python testserver supports the following ursl

- http://localhost:5000/test/allunit
- http://localhost:5000/test/allplots
- http://localhost:5000/test/glyph
- http:///localhost:5000/test/tick

if you want to execute the built js from hem, use the following

`$ hem build ` or `hem build -d` (-d will leave the file un-minified)
`$python testserver.py prod`

