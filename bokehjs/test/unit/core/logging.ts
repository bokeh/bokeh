import {expect} from "assertions"

import {Logger, logger, set_log_level, LogLevel} from "@bokehjs/core/logging"

import {trap} from "../../util"

describe("logging module", () => {

  describe("logger", () => {
    it("should default to log level 'info'", () => {
      expect(logger.level).to.be.equal(Logger.INFO)
    })
  })

  describe("set_log_level", () => {

    describe("sets accepted levels", () => {

      let original: LogLevel | null = null
      after_each(() => {
        if (original != null)
          set_log_level(original)
      })

      it("trace", () => {
        const out = trap(() => original = set_log_level("trace"))
        expect(out.log).to.be.equal("[bokeh] setting log level to: 'trace'\n")
        expect(logger.level).to.be.equal(Logger.TRACE)
      })

      it("debug", () => {
        const out = trap(() => original = set_log_level("debug"))
        expect(out.log).to.be.equal("[bokeh] setting log level to: 'debug'\n")
        expect(logger.level).to.be.equal(Logger.DEBUG)
      })

      it("info", () => {
        const out = trap(() => original = set_log_level("info"))
        expect(out.log).to.be.equal("[bokeh] setting log level to: 'info'\n")
        expect(logger.level).to.be.equal(Logger.INFO)
      })
      it("warn", () => {
        const out = trap(() => original = set_log_level("warn"))
        expect(out.log).to.be.equal("[bokeh] setting log level to: 'warn'\n")
        expect(logger.level).to.be.equal(Logger.WARN)
      })
      it("error", () => {
        const out = trap(() => original = set_log_level("error"))
        expect(out.log).to.be.equal("[bokeh] setting log level to: 'error'\n")
        expect(logger.level).to.be.equal(Logger.ERROR)
      })

      it("fatal", () => {
        const out = trap(() => original = set_log_level("fatal"))
        expect(out.log).to.be.equal("[bokeh] setting log level to: 'fatal'\n")
        expect(logger.level).to.be.equal(Logger.FATAL)
      })

      it("off", () => {
        const out = trap(() => original = set_log_level("off"))
        expect(out.log).to.be.equal("[bokeh] setting log level to: 'off'\n")
        expect(logger.level).to.be.equal(Logger.OFF)
      })
    })

    it("ignores unknown levels", () => {
      const out = trap(() => set_log_level("bad"))
      expect(out.log).to.be.equal("[bokeh] unrecognized logging level 'bad' passed to Bokeh.set_log_level(), ignoring\n[bokeh] valid log levels are: trace, debug, info, warn, error, fatal, off\n")
    })
  })
})
