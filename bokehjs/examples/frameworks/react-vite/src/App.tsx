import {Bokeh} from "@bokeh/react"

import {plot} from "./plot"

export function App() {
  return <Bokeh model={plot}/>
}
