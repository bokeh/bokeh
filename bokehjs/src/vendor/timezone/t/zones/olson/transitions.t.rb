#!/usr/bin/env ruby

require "time"
require "date"

DIR = File.expand_path(File.dirname(__FILE__))
ZONES = File.expand_path("#{DIR}/../../../build")

ENV["TZ"] = "UTC"
counter = 0
File.open("#{ZONES}/transitions.txt", "r") do |infile|
  while (line = infile.gets)
    name, wallclock, posix, before, after = line.split(/\s/)
    time = Time.parse posix
    if time.year > 1902
      counter = counter + 2
    end
  end
end

puts "1..#{counter}"

counter = 1
File.open("#{ZONES}/transitions.txt", "r") do |infile|
  while (line = infile.gets)
    name, wallclock, posix, before, after = line.split(/\s/)
    ENV["TZ"] = "UTC"
    time = Time.parse posix
    if time.year > 1902
      ENV["TZ"] = ":#{ZONES}/zoneinfo/#{name}"
      time = Time.at(time.to_i)
      offsetAbbrevation = (time + 60).strftime("%::z/%Z")
      ok = after == offsetAbbrevation ? "ok" : "not ok"
      puts "#{ok} #{counter} after #{name} #{wallclock} #{posix} #{after} #{offsetAbbrevation}"
      counter = counter + 1
      offsetAbbrevation = (time - 60).strftime("%::z/%Z")
      ok = (before == offsetAbbrevation ? "ok" : "not ok")
      puts "#{ok} #{counter} before #{name} #{wallclock} #{posix} #{before} #{offsetAbbrevation}"
      counter = counter + 1
    end
  end
end

# vim: ft=ruby :
