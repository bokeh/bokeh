import {StrictMode} from "react"
import {createRoot} from "react-dom/client"

import {App} from "./App"

createRoot(document.querySelector("#app")!).render(<StrictMode><App/></StrictMode>)
