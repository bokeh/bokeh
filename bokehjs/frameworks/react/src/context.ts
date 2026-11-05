"use client"

import {createContext} from "react"
import type {DocumentMountController, SessionMountController} from "@bokeh/framework"

// Static document and live session providers use the same root-slot context.
export const BokehDocumentContext = createContext<DocumentMountController | SessionMountController | null>(null)
