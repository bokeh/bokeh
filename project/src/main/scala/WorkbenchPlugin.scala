import sbt._
import Keys._

import akka.actor.{ActorRef,Actor,ActorSystem}
import scala.concurrent.duration._
import akka.actor.ActorDSL._
import com.typesafe.config.ConfigFactory

import play.api.libs.json.Json
import play.api.libs.json.JsArray

import spray.http.{AllOrigins, HttpResponse}
import spray.routing.SimpleRoutingApp
import spray.http.HttpHeaders.`Access-Control-Allow-Origin`

object WorkbenchPlugin extends sbt.Plugin with SimpleRoutingApp {
    implicit val system = ActorSystem("Workbench", classLoader=Option(getClass.getClassLoader))

    object WorkbenchKeys {
        val reloadBrowsers = taskKey[Unit]("Sends a message to all connected web pages asking them to reload the page")
        val workbenchPort = settingKey[Int]("Setup websocket server on this port")
        val renderScript = taskKey[String]("Render workbench.js")
        val workbench = taskKey[Unit]("Start workbench server")
    }

    import WorkbenchKeys._

    val pubSub = actor(new Actor {
        var waitingActor: Option[ActorRef] = None
        var queuedMessages = List[JsArray]()

        case object Clear
        import system.dispatcher

        system.scheduler.schedule(0 seconds, 10 seconds, self, Clear)

        def respond(a: ActorRef, s: String) = {
            a ! HttpResponse(entity=s, headers=List(`Access-Control-Allow-Origin`(AllOrigins)))
        }

        def receive = (x: Any) =>
            (x, waitingActor, queuedMessages) match {
                case (a: ActorRef, _, Nil) =>
                    waitingActor = Some(a)
                case (a: ActorRef, None, msgs) =>
                    respond(a, "[" + msgs.mkString(",") + "]")
                    queuedMessages = Nil
                case (msg: JsArray, None, msgs) =>
                    queuedMessages = msg :: msgs
                case (msg: JsArray, Some(a), Nil) =>
                    respond(a, "[" + msg + "]")
                    waitingActor = None
                case (Clear, Some(a), Nil) =>
                    respond(a, "[]")
                    waitingActor = None
            }
    })


    val workbenchSettings = Seq(
        workbenchPort := 50060,
        renderScript <<= Def.task {
            val stream = getClass.getClassLoader.getResourceAsStream("workbench.js")
            val template = try { IO.readStream(stream) } finally { stream.close() }
            template.replace("<port>", workbenchPort.value.toString)
        },
        extraLoggers := {
            val clientLogger = FullLogger {
                new Logger {
                    def log(level: Level.Value, message: => String) =
                        if (level >= Level.Info)
                            pubSub ! Json.arr("print", level.toString, message)

                    def success(message: => String) =
                        pubSub ! Json.arr("print", "info", message)

                    def trace(t: => Throwable) =
                        pubSub ! Json.arr("print", "error", t.toString)
                }
            }
            clientLogger.setSuccessEnabled(true)
            val currentLoggers = extraLoggers.value
            (key: ScopedKey[_]) => clientLogger +: currentLoggers(key)
        },
        reloadBrowsers := {
            streams.value.log.info("workbench: Reloading Pages ...")
            pubSub ! Json.arr("reload")
        },
        workbench := Def.task {
            startServer("localhost", workbenchPort.value) {
                get {
                    path("workbench.js") {
                        complete {
                            renderScript.value
                        }
                    } ~
                    getFromDirectory(".")
                } ~
                post {
                    path("notifications") { ctx =>
                        pubSub ! ctx.responder
                    }
                }
            }
        })
}
