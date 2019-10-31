import {WorkerContext} from "@labor/asset-building/dist/Core/WorkerContext";
import {AssetBuilderEventList} from "@labor/asset-building/dist/AssetBuilderEventList";
import {CoreContext} from "@labor/asset-building/dist/Core/CoreContext";

/**
 * Helper which draws a line for "design" purposes
 * @param char
 */
function drawLine(char?: string): string {
	char = typeof char === "string" ? char : "=";
	return char.repeat(90);
}

/**
 * This helper is used to rewrite the webpack app configuration to match the requirements
 * for the hot module replacement middleware
 */
function rewriteAppConfig(context: WorkerContext): void {
	const config = context.webpackConfig;
	config.watch = true;

	// Rewrite entry to inject additional scripts
	if (typeof config.entry === "string") config.entry = [config.entry];
	if (Array.isArray(config.entry)) config.entry = {main: config.entry};
	if (typeof config.entry !== "object" || !Array.isArray(config.entry.main)) throw new Error("Invalid entry configuration!");
	config.entry.main.unshift("webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true");
	config.entry.main.unshift("eventsource-polyfill");

	// Disable git adding
	context.app.disableGitAdd = true;

	// Require support for hot module replacement
	config.plugins.push(new (require("webpack")).HotModuleReplacementPlugin());
}

export default function (context: CoreContext, scope: string) {
	if (scope !== "global") throw new Error("The dev server extension has to be registered on a global scale!");
	if (context.builderVersion !== 2) throw new Error("The dev server only works with builder version 2 definitions!");

	// Add the dev mode into the config
	context.eventEmitter.bind(AssetBuilderEventList.GET_MODES, (e) => {
		e.args.modes.push("dev");
	});

	// Mark the process as non production when the dev server is active
	context.eventEmitter.bind(AssetBuilderEventList.IS_PROD, (e) => {
		e.args.isProd = e.args.mode === "dev" ? false : e.args.isProd;
	});

	// Set the mode to dev if we are running in express context
	context.eventEmitter.bind(AssetBuilderEventList.GET_MODE, (e) => {
		if (global.EXPRESS_DEV_SERVER_PLUGIN_MODE === true &&
			process.env.NODE_ENV === "development") e.args.mode = "dev";
	});

	// Register our custom compiler
	context.eventEmitter.bind(AssetBuilderEventList.FILTER_WEBPACK_COMPILER, (e) => {
		// Ignore if we are not in dev mode
		const context: WorkerContext = e.args.context;
		if (context.mode !== "dev") return;

		// Check if we are running as plugin in an existing app
		if (context.parentContext.isExpress === true) {
			// Rewrite element config
			rewriteAppConfig(context);
			return;
		}

		// Check if the app disables the dev server
		if (context.app.disableDevServer) return;

		// Stop the propagation
		e.stopPropagation();
		const webpack = e.args.compiler;

		// Add a foo compiler
		e.args.compiler = function () {
			return true;
		};

		// Return a promise while we are starting our server
		return new Promise((resolve, reject) => {
			// Prepare the server
			const http = require("http");
			const express = require("express");
			const expressApp = express();
			const portFinder = require("portfinder");

			// Get a new port for the server to work on
			portFinder.getPortPromise({
				port: 8080 + context.appId * 10,
				stopPort: 8150
			}).then(port => {

				// Render a header
				console.log("");
				console.log("Dev-Server started and is now listening on " + port + "!");
				console.log(drawLine());
				console.log("* APP - " + context.app.appName + ": http://js.localmachine.space:" + port + "/");
				console.log(drawLine());

				// Rewrite element config
				rewriteAppConfig(context);

				// Create the webpack instance
				const compiler = webpack(context.webpackConfig, (err, stats) => {
					// Check if we got obvious errors
					if (err !== null) return reject(err);
					context.webpackCallback(context, stats).catch(reject);
				});

				// Register fallback for history router
				expressApp.use(require("connect-history-api-fallback")({
					"index": "/"
				}));

				// Register webpack as express middleware
				expressApp.use(require("webpack-dev-middleware")(compiler.compiler, {
					logLevel: "silent",
					publicPath: "/"
				})).use(require("webpack-hot-middleware")(compiler.compiler, {
					// log: false,
					path: "/__webpack_hmr",
					heartbeat: 10 * 1000
				}));

				// Start the server
				const server = http.createServer(expressApp);
				server.listen(port);
				resolve();
			}).catch(e.args.reject);
		});
	});
}