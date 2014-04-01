List("sbt-js", "sbt-less").map(name => addSbtPlugin("com.untyped" % name % "0.7"))

resolvers += "spray repo" at "http://repo.spray.io"

resolvers += Resolver.typesafeRepo("releases")

addSbtPlugin("com.lihaoyi" %% "workbench" % "0.1.1")

scalacOptions ++= Seq("-Xlint", "-deprecation", "-unchecked", "-feature", "-language:postfixOps")
