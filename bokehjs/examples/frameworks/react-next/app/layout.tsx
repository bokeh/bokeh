import type {Metadata} from "next"
import type {ReactNode} from "react"

import "./globals.css"

export const metadata: Metadata = {
  title: "BokehJS with Next.js",
  description: "Using the Bokeh React adapter in a Next.js App Router page",
}

export default function RootLayout({children}: Readonly<{children: ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>
}
