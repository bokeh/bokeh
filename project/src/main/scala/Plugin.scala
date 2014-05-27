import org.mozilla.javascript.Context

trait Rhino {
    def withContext[T](fn: Context => T): T = {
        val ctx = Context.enter()
        try {
            ctx.setOptimizationLevel(-1)
            ctx.setLanguageVersion(Context.VERSION_1_8)
            fn(ctx)
        } finally {
            Context.exit()
        }
    }
}
