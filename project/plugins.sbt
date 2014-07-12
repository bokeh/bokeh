addSbtPlugin("com.untyped" % "sbt-js" % "0.7")

libraryDependencies += "org.jgrapht" % "jgrapht-ext" % "0.9.0"

scalacOptions ++= Seq("-Xlint", "-deprecation", "-unchecked", "-feature", "-language:postfixOps")
