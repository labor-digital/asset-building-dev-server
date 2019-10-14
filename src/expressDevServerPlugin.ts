import {Application} from "express";
import {CompilerFactory} from "@labor/asset-building/dist/CompilerFactory";

declare global {
	namespace NodeJS {
		interface Global {
			EXPRESS_DEV_SERVER_PLUGIN_MODE: boolean
		}
	}
}

module.exports = function expressDevServerPlugin(app: Application, cwd?: string | null, appId?: number): Promise<Application> {

	// Ignore if this is not a dev context
	if (process.env.NODE_ENV !== "development") {
		console.log("expressDevServerPlugin: Skipping webpack, because NODE_ENV is not set to \"development\"!");
		return Promise.resolve(app);
	}

	// Force the mode
	process.argv[2] = "dev";

	// Prepare the process
	if (typeof cwd !== "string") cwd = process.cwd();
	global.EXPRESS_DEV_SERVER_PLUGIN_MODE = true;

	// Initialize the webpack compiler
	return CompilerFactory.getWebpackCompiler(cwd, appId).then(compiler => {
		// @ts-ignore
		if (typeof compiler.compiler !== "undefined") compiler = compiler.compiler;

		// Register webpack as express middleware
		app.use(require("webpack-dev-middleware")(compiler, {
			logLevel: "silent",
			publicPath: compiler.options.output.publicPath
		}));
		app.use(require("webpack-hot-middleware")(compiler, {
			// log: false,
			path: "/__webpack_hmr",
			heartbeat: 10 * 1000
		}));

		// Return the app
		return app;
	});
};