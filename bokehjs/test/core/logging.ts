{expect} = require "chai"
utils = require "../utils"
{ stdoutTrap, stderrTrap } = require 'logtrap'

{Logger, logger, set_log_level} = utils.require "core/logging"

describe "logging module", ->

  describe "logger", ->
    it "should default to log level 'info'", ->
      expect(logger.level).to.be.equal(Logger.INFO)

  describe "set_log_level", ->

    describe "sets accepted levels", ->

      it "trace", ->
        out = stdoutTrap -> set_log_level("trace")
        expect(out).to.be.equal "[bokeh] setting log level to: 'trace'\n"
        expect(logger.level).to.be.equal(Logger.TRACE)

      it "debug", ->
        out = stdoutTrap -> set_log_level("debug")
        expect(out).to.be.equal "[bokeh] setting log level to: 'debug'\n"
        expect(logger.level).to.be.equal(Logger.DEBUG)

      it "info", ->
        out = stdoutTrap -> set_log_level("info")
        expect(out).to.be.equal "[bokeh] setting log level to: 'info'\n"
        expect(logger.level).to.be.equal(Logger.INFO)
      it "warn", ->
        out = stdoutTrap -> set_log_level("warn")
        expect(out).to.be.equal "[bokeh] setting log level to: 'warn'\n"
        expect(logger.level).to.be.equal(Logger.WARN)
      it "error", ->
        out = stdoutTrap -> set_log_level("error")
        expect(out).to.be.equal "[bokeh] setting log level to: 'error'\n"
        expect(logger.level).to.be.equal(Logger.ERROR)

      it "fatal", ->
        out = stdoutTrap -> set_log_level("fatal")
        expect(out).to.be.equal "[bokeh] setting log level to: 'fatal'\n"
        expect(logger.level).to.be.equal(Logger.FATAL)

      it "off", ->
        out = stdoutTrap -> set_log_level("off")
        expect(out).to.be.equal "[bokeh] setting log level to: 'off'\n"
        expect(logger.level).to.be.equal(Logger.OFF)

    it "ignores unknown levels", ->
      out = stdoutTrap -> set_log_level("bad")
      expect(out).to.be.equal("[bokeh] unrecognized logging level 'bad' passed to Bokeh.set_log_level(), ignoring\n[bokeh] valid log levels are: trace, debug, info, warn, error, fatal, off\n")
