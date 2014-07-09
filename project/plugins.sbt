addSbtPlugin("com.untyped" % "sbt-js" % "0.7")

libraryDependencies += "com.yahoo.platform.yui" %  "yuicompressor" % "2.4.7"

scalacOptions ++= Seq("-Xlint", "-deprecation", "-unchecked", "-feature", "-language:postfixOps")
