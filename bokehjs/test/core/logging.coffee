{expect} = require "chai"
utils = require "../utils"
{ stdoutTrap, stderrTrap } = require 'logtrap'

logging = utils.require "core/logging"

describe "logging module", ->

  describe "exports", ->
    it "should have levels", ->
      expect("levels" of logging).to.be.true

    it "should have logger", ->
      expect("logger" of logging).to.be.true

    it "should have set_log_level", ->
      expect("set_log_level" of logging).to.be.true

  describe "logger", ->
    it "should default to log level 'info'", ->
      expect(logging.logger.level).to.be.equal logging.levels.info

  describe "set_log_level", ->

    describe "sets accepted levels", ->

      it "trace", ->
        out = stdoutTrap -> logging.set_log_level("trace")
        expect(out).to.be.equal "Bokeh: setting log level to: 'trace'\n"
        expect(logging.logger.level).to.be.equal logging.levels.trace

      it "debug", ->
        out = stdoutTrap -> logging.set_log_level("debug")
        expect(out).to.be.equal "Bokeh: setting log level to: 'debug'\n"
        expect(logging.logger.level).to.be.equal logging.levels.debug

      it "info", ->
        out = stdoutTrap -> logging.set_log_level("info")
        expect(out).to.be.equal "Bokeh: setting log level to: 'info'\n"
        expect(logging.logger.level).to.be.equal logging.levels.info
      it "warn", ->
        out = stdoutTrap -> logging.set_log_level("warn")
        expect(out).to.be.equal "Bokeh: setting log level to: 'warn'\n"
        expect(logging.logger.level).to.be.equal logging.levels.warn
      it "error", ->
        out = stdoutTrap -> logging.set_log_level("error")
        expect(out).to.be.equal "Bokeh: setting log level to: 'error'\n"
        expect(logging.logger.level).to.be.equal logging.levels.error

      it "fatal", ->
        out = stdoutTrap -> logging.set_log_level("fatal")
        expect(out).to.be.equal "Bokeh: setting log level to: 'fatal'\n"
        expect(logging.logger.level).to.be.equal logging.levels.fatal

    it "ignores unknown levels", ->
      out = stdoutTrap -> logging.set_log_level("bad")
      expect(out).to.be.equal "Bokeh: Unrecognized logging level 'bad' passed to Bokeh.set_log_level, ignoring.\nBokeh: Valid log levels are: trace,debug,info,warn,error,fatal\n"
