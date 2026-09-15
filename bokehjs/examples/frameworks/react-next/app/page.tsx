import {BokehExample} from "./BokehExample"

export default function Page() {
  return <main className="app-shell">
    <p className="eyebrow">Framework integration example</p>
    <h1>BokehJS + Next.js</h1>
    <p className="intro">An App Router page renders an interactive Bokeh plot through a React client component.</p>
    <BokehExample/>
    <p className="note">Next.js owns the page and rendering boundary; BokehJS owns the live plot.</p>
  </main>
}
