data_url = "http://quantquote.com/files/quantquote_daily_sp500_83986.zip"
import os
from os.path import splitext
os.system("wget %s" % data_url)
os.system("unzip %s" % "quantquote_daily_sp500_83986.zip")
