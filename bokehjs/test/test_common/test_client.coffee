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
{pull_session} = utils.require "common/client"
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

_previous_port = 5007
next_port = () ->
  _previous_port += 1
  _previous_port

server_timeout_millis = 7500

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
  port = next_port()
  env = _.extend({}, process.env, { PYTHONPATH: pypath })
  handle = child_process.spawn("python", ["-c", "import bokeh.command as command; command.main(['bokeh', 'serve', '--port=#{port}'])"], {
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
      # yay javascript, stick attributes on anything!
      handle.url = "ws://localhost:#{port}/ws"
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
    else if num_server_attempts > (server_timeout_millis / 100)
      promise.reject(new Error("Failed to connect to the server"))
    else if client != null
      # still waiting on a client we already have...
      setTimeout checkServer, 100
    else
      num_server_attempts = num_server_attempts + 1
      client = net.connect(port, 'localhost')
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

  # It takes time to spin up the server so without this things get
  # flaky on Travis. Lengthen if we keep getting Travis failures.
  # The default (at least when this comment was written) was
  # 2000ms.
  @timeout(server_timeout_millis)

  it "should be able to connect", ->
    promise = with_server (server_process) ->
      pull_session(url=server_process.url).then(
        (session) ->
          console.log("Connection result #{session}")
          session.close()
          "OK"
        (error) ->
          console.log("Connection error #{error}")
          throw error
      )
    expect(promise).eventually.to.equal("OK")

  it "should get server info", ->
    promise = with_server (server_process) ->
      pull_session(url=server_process.url).then(
        (session) ->
          console.log("Connection result #{session}")
          session.request_server_info().then(
            (info) ->
              console.log("Server info ", info)
              expect(info).to.have.property('version_info')
              "OK"
          )
      )
    expect(promise).eventually.to.equal("OK")

  it "should sync a document between two connections", ->
    promise = with_server (server_process) ->
      added_root = pull_session(url=server_process.url).then(
        (session) ->
          root1 = new Range1d({start: 123, end: 456})
          session.document.add_root(root1)
          session.document.set_title("Hello Title")
          session.force_roundtrip().then((ignored) -> session)
        (error) ->
          throw error
      ).catch (error) ->
        throw error

      added_root.then(
        (session1) ->
          ok = pull_session(url=server_process.url, session_id=session1.id).then(
            (session2) ->
              try
                expect(session2.document.roots().length).to.equal 1
                root = session2.document.roots()[0]
                expect(root.get('start')).to.equal 123
                expect(root.get('end')).to.equal 456
                expect(session2.document.title()).to.equal "Hello Title"
              catch e
                console.log("Exception was ", e)
                throw e
              finally
                session1.close()
                session2.close()
              "OK"
            (error) ->
              session1.close()
              throw error
          )
          # es6 promises would swallow the test errors otherwise
          ok.catch (error) ->
            throw error
        (error) ->
          throw error
      ).catch (error) ->
          throw error
    expect(promise).eventually.to.equal("OK")
