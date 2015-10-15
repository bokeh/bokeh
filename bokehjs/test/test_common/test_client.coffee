_ = require "underscore"
chai = require "chai"
chai.use(require "chai-as-promised")
expect = chai.expect
utils = require "../utils"
child_process = require "child_process"
{Promise} = require "es6-promise"
path = require "path"
net = require "net"

# node.js compat shim for WebSocket
global.WebSocket = require("websocket").w3cwebsocket

HasProperties = utils.require "common/has_properties"
{Document, ModelChangedEvent} = utils.require "common/document"
{ClientConnection, ClientSession, DEFAULT_SERVER_WEBSOCKET_URL} = utils.require "common/client"
Range1d = utils.require("range/range1d").Model

# Promise works in a very annoying way, make it
# have resolve and reject methods instead
promise_with_methods = () ->
  capture_resolve = null
  capture_reject = null
  promise = new Promise (resolve, reject) ->
    capture_resolve = resolve
    capture_reject = reject
  promise.resolve = (value) ->
    capture_resolve(value)
  promise.reject = (value) ->
    capture_reject(value)
  promise

# Launch server, wait for it to be alive, and then
# run a test function that returns a Promise
with_server = (f) ->
  promise = promise_with_methods()
  all_done = false
  mark_done = (value_or_error) ->
    all_done = true
  promise.then(mark_done, mark_done)

  basedir = path.normalize(process.cwd() + "/..")
  oldpath = process.env['PYTHONPATH']
  if oldpath?
    pypath = "#{basedir}:#{oldpath}"
  else
    pypath = basedir
  env = _.extend({}, process.env, { PYTHONPATH: pypath })
  handle = child_process.spawn("python", ["-c", "import bokeh.bk as bk; bk.main()"], {
    env: env,
    cwd: basedir
  })
  handle.stdout.on 'data', (data) ->
    console.log("server out: #{data}")
  handle.stderr.on 'data', (data) ->
    console.log("server err: #{data}")
  handle.on 'close', (code) ->
    console.log("server exited #{code}")
    promise.reject(new Error("Server exited before test promise was resolved"))

  cleanup_process = (value_or_error) ->
    console.log("Killing server process")
    handle.kill()

  promise.then(cleanup_process, cleanup_process)

  runF = () ->
    if all_done
      return
    try
      v = f(handle)
      # note that "v" can be another promise OR a final value
      promise.resolve(v)
    catch e
      promise.reject(e)

  client = null
  server_ready = false
  num_server_attempts = 0
  checkServer = () ->
    if all_done or server_ready
      if client?
        client.destroy()
        client = null
    else if num_server_attempts > 10
      promise.reject(new Error("Failed to connect to the server"))
    else if client != null
      # still waiting on a client we already have...
      setTimeout checkServer, 100
    else
      num_server_attempts = num_server_attempts + 1
      client = net.connect(5006, 'localhost')
      client.on 'error', () ->
        client.destroy()
        client = null
        if not (all_done or server_ready)
          setTimeout checkServer, 100
      client.on 'connect', () ->
        client.destroy()
        client = null
        server_ready = true
        setTimeout runF, 0

  setTimeout checkServer, 100

  promise

describe "Client", ->

  it "should be able to connect", ->
    promise = with_server (server_process) ->
      connection = new ClientConnection(DEFAULT_SERVER_WEBSOCKET_URL)
      connection.connect().then(
        (value) ->
          console.log("Connection result #{value}")
          connection.close()
          "OK"
        (error) ->
          console.log("Connection error #{error}")
          connection.close()
          throw error
      )
    expect(promise).eventually.to.equal("OK")

  it "should sync a document between two connections", ->
    promise = with_server (server_process) ->
      connection1 = new ClientConnection(DEFAULT_SERVER_WEBSOCKET_URL)
      added_root = connection1.connect().then(
        (value) ->
          connection1.pull_session().then(
            (session) ->
              root1 = new Range1d({start: 123, end: 456})
              session.document.add_root(root1)
              session.id
            (error) ->
              throw error
          )
        (error) ->
          throw error
      )

      added_root.then(
        (session_id) ->
          connection2 = new ClientConnection(DEFAULT_SERVER_WEBSOCKET_URL)
          ok = connection2.connect().then(
            (value) ->
              connection2.pull_session(session_id).then(
                (session) ->
                  expect(session.document.roots().length).to.equal 1
                  root = session.document.roots()[0]
                  expect(root.get('start')).to.equal 123
                  expect(root.get('end')).to.equal 456
                  "OK"
                (error) ->
                  throw error
              )
            (error) ->
              throw error
          )
          ok.then(
            (value) ->
              connection1.close()
              connection2.close()
            (error) ->
              connection1.close()
              connection2.close()
          )
          ok
        (error) ->
          throw error
      )
    expect(promise).eventually.to.equal("OK")
