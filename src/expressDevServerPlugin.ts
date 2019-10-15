import ExpressContext from "@labor/asset-building/dist/Express/ExpressContext";

declare global {
	namespace NodeJS {
		interface Global {
			EXPRESS_DEV_SERVER_PLUGIN_MODE: boolean
		}
	}
}

// Mark plugin as loaded
global.EXPRESS_DEV_SERVER_PLUGIN_MODE = true;

module.exports = function expressDevServerPlugin(context: ExpressContext): Promise<ExpressContext> {

	// Ignore if this is not a dev context
	if (context.isProd) {
		console.log("expressDevServerPlugin: Skipping dev server, because the app is running in production mode!");
		return Promise.resolve(context);
	}

	// Register webpack as express middleware
	context.expressApp.use(require("webpack-dev-middleware")(context.compiler, {
		logLevel: "silent",
		publicPath: context.compiler.options.output.publicPath.replace(/^\./, "")
	}));
	context.expressApp.use(require("webpack-hot-middleware")(context.compiler, {
		// log: false,
		path: "/__webpack_hmr",
		heartbeat: 10 * 1000
	}));

	// Done
	return Promise.resolve(context);
};