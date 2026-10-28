import {StrictMode, useEffect, useMemo, useState} from "react"
import {createRoot} from "react-dom/client"

import {connect_session} from "@bokeh/bokehjs"
import {Div, Slider} from "@bokeh/bokehjs/widgets"
import {BokehRoot, BokehSession} from "@bokeh/react"

import "../live.css"

type SessionOwner = ReturnType<typeof connect_session>
type Session = Awaited<SessionOwner["ready"]>

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

// This component borrows the session. It owns one mount and all its views.
// React can remove it without closing the connection or destroying the document.
function BorrowedRoots({session}: {session: Session}) {
  const source = useMemo(() => ({session}), [session])
  const [plotDetached, setPlotDetached] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return <BokehSession source={source} onMounted={() => setReady(true)} onError={(error) => setError(message(error))}>
    <section className="roots" aria-label="Borrowed Bokeh views">
      <div className="root-panel">
        <h2>Server controls</h2>
        <BokehRoot model="controls" data-testid="controls-host"/>
        <h2>Server status</h2>
        <BokehRoot model="status" data-testid="status-host"/>
        <h2>Dynamic root</h2>
        <p>Set the value to 5 or higher to add a root; below 5 removes it.</p>
        <BokehRoot model="extra" data-testid="extra-host"/>
      </div>
      <div className="root-panel">
        <button data-testid="toggle-plot" disabled={!ready} onClick={() => setPlotDetached((value) => !value)}>
          {plotDetached ? "Reattach plot" : "Detach plot"}
        </button>
        <p>The controls and status keep their views when the plot detaches.</p>
        {plotDetached ? <div data-testid="plot-host"/> : <BokehRoot model="plot" data-testid="plot-host"/>}
      </div>
      {error != null && <p role="alert">Render failed: {error}</p>}
    </section>
  </BokehSession>
}

function LiveDocument({session}: {session: Session}) {
  const [showViews, setShowViews] = useState(true)
  const [, refresh] = useState(0)
  useEffect(() => {
    const update = () => refresh((value) => value + 1)
    session.document.on_change(update)
    return () => session.document.remove_on_change(update)
  }, [session])
  const slider = session.document.get_model_by_name("controls")
  const status = session.document.get_model_by_name("status")
  if (!(slider instanceof Slider) || !(status instanceof Div)) {
    return <p role="alert">The server document is missing the example models.</p>
  }
  return <>
    <section className="session-panel">
      <label htmlFor="client-value">React control: {slider.value}</label>
      <input id="client-value" data-testid="client-value" type="range" min={slider.start} max={slider.end}
        step={slider.step ?? "any"} value={slider.value} onChange={(event) => { slider.value = event.currentTarget.valueAsNumber }}/>
      <p data-testid="session-status">{status.text}</p>
      <p data-testid="root-count">Document roots: {session.document.roots().length}</p>
      <button data-testid="toggle-views" onClick={() => setShowViews((show) => !show)}>
        {showViews ? "Dispose borrowed views" : "Mount borrowed views"}
      </button>
      <p>The server counter and React control continue working while all Bokeh views are disposed.</p>
    </section>
    {showViews && <BorrowedRoots session={session}/>}
  </>
}

function App() {
  const [connected, setConnected] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSession(null)
    setError(null)
    if (!connected) {
      return
    }
    const abort = new AbortController()
    let owner: SessionOwner | undefined
    let acquired: Session | undefined
    void (async () => {
      const response = await fetch("/session", {signal: abort.signal})
      if (!response.ok) {
        throw new Error(`Session bootstrap failed: HTTP ${response.status}`)
      }
      const bootstrap: {url: string, token: string} = await response.json()
      abort.signal.throwIfAborted()
      const url = new URL(bootstrap.url, window.location.href)
      url.protocol = url.protocol == "https:" ? "wss:" : "ws:"
      owner = connect_session({url: url.href, token: bootstrap.token, signal: abort.signal})
      acquired = await owner.ready
      if (abort.signal.aborted) {
        acquired.document.destroy()
      } else {
        setSession(acquired)
      }
    })().catch((error) => {
      if (!abort.signal.aborted) {
        setError(message(error))
      }
    })
    return () => {
      // This outer scope owns acquisition. It closes the connection, including
      // an in-flight connection during React StrictMode's effect cleanup.
      abort.abort()
      owner?.dispose()
      // App exclusively owns this acquired document. Let React finish disposing
      // its child mounts before destroying it. Borrowed-view cleanup never does.
      if (acquired != null) {
        const {document} = acquired
        queueMicrotask(() => document.destroy())
      }
    }
  }, [connected])

  return <main>
    <h1>A live Bokeh session in React</h1>
    <p>React places independent roots from one server document. The server updates every second.</p>
    <button data-testid="toggle-session" onClick={() => setConnected((value) => !value)}>
      {connected ? "Disconnect owned session" : "Connect a new session"}
    </button>
    {error != null && <p role="alert">Connection failed: {error}</p>}
    {connected && session == null && error == null && <p role="status">Connecting…</p>}
    {!connected && <p role="status">Disconnected. The owning scope has closed the connection.</p>}
    {connected && session != null && <LiveDocument session={session}/>}
  </main>
}

createRoot(document.querySelector("#app")!).render(<StrictMode><App/></StrictMode>)
