/**
 * Created by Martin Neundorfer on 18.12.2018.
 * For LABOR.digital
 */
module.exports = class DevServerPlugin {

	getModes(modes) {
		let hasDev = false;
		modes.forEach(mode => {
			if (mode === "dev") hasDev = true;
		});
		if (!hasDev) modes.push("dev");
		return modes;
	}

	isProd(isProd, mode) {
		return isProd ? mode !== "dev" : isProd;
	}

	filterLaborConfig(laborConfig, context) {
		if (context.mode !== "dev") return laborConfig;
		if (laborConfig.builderVersion < 2) throw new Error("The dev server only works with build version 2 apps!");
		return laborConfig;
	}

	isComponentEnabled(enabled, component, context) {
		if (context.mode !== "dev") return enabled;

		// Enable HtmlPlugin
		if (component === "HtmlPlugin") return true;
		// Disable output cleaner plugin
		if (component === "CleanOutputDirPlugin") return false;
		return enabled;
	}

	/**
	 *
	 * @param {module.ConfigBuilderContext} context
	 * @param key
	 * @return {*}
	 */
	afterComponent(context, key) {
		if (context.mode !== "dev") return context;

		// Make sure at least the default template is enabled
		if (typeof context.currentAppConfig.htmlTemplate === "undefined")
			context.currentAppConfig.htmlTemplate = true;

		return context;
	}

	alternativeCompiler(useDefaultCompiler, webpack, callback, context) {
		if (context.mode !== "dev") return useDefaultCompiler;

		// Prepare the server
		const http = require("http");
		const express = require("express");
		const app = express();
		const MiscHelpers = require("@labor/asset-building/src/Helpers/MiscHelpers");
		const portfinder = require("portfinder");

		// Get a new port for the server to work on
		portfinder.getPortPromise({
			port: 8080,
			stopPort: 8150
		}).then(port => {
			// Keep the callback alive
			context.laborConfig.keepAlive = true;

			// Render a header
			console.log("");
			console.log("Dev-Server started and is now listening on " + port + "!");
			console.log(MiscHelpers.drawLine());
			context.webpackConfig.forEach(config => {
				console.log("* APP - " + config.name + ": http://js.localmachine.space:" + port + "/app-" + config.name + "/");
			});
			console.log(MiscHelpers.drawLine());

			// Creating webpack instances
			context.webpackConfig.forEach(config => {
				// Rewrite element config
				config = this._rewriteAppConfig(config, context);

				// Create wrapper for stat rendering
				// This simulates the "child" rendering that is used in our asset-building strategy
				const statWrapper = function (stats) {
					return {
						toJson: function () {
							const c = stats.toJson(...arguments);
							c.name = config.name;
							return {
								children: [c]
							}
						}
					}
				};

				// Create a compiler wrapper to use our own callbacks
				const compiler = webpack(config);
				compiler.__run = compiler.run;
				compiler.run = function (c, callback) {
					return compiler.__run(c, function (e, s) {
						context.callback(context, e, statWrapper(s));
						return callback.call(compiler, ...arguments);
					});
				};
				compiler.__watch = compiler.watch;
				compiler.watch = function (c, callback) {
					return compiler.__watch(c, function (e, s) {
						context.callback(context, e, statWrapper(s));
						return callback.call(compiler, ...arguments);
					});
				};

				// Register fallback for history router
				app.use(require("connect-history-api-fallback")({
					"index": "/app-" + config.name
				}));

				// Register webpack as express middleware
				app.use(require("webpack-dev-middleware")(compiler, {
					logLevel: "silent",
					publicPath: config.output.publicPath
				})).use(require("webpack-hot-middleware")(compiler, {
					// log: false,
					path: config.output.publicPath + "__webpack_hmr",
					heartbeat: 10 * 1000
				}));

			});

			// Start the server
			const server = http.createServer(app);
			server.listen(port);
		}).catch(err => {
			throw new Error(err);
		});


		// Done -> True disables default compiling
		return false;
	}

	/**
	 * This helper is used to receive the webpack config of a single app which is then
	 * restructured to work with the hot module replacement middleware
	 *
	 * @param config
	 * @param {module.ConfigBuilderContext} context
	 * @return {*}
	 * @private
	 */
	_rewriteAppConfig(config, context) {
		// Rewrite app configuration
		const appId = "app-" + config.name;
		const appConfig = context.laborConfig.apps[parseInt(config.name)];

		delete config.output.path;
		config.output.publicPath = "/" + appId;

		// Rewrite entry to inject additional scripts
		if(typeof config.entry === "string") config.entry = [config.entry];
		if(Array.isArray(config.entry)) config.entry = {main: config.entry};
		if(typeof config.entry !== "object" || !Array.isArray(config.entry.main)) throw new Error("Invalid entry configuration!");
		config.entry.main.unshift("webpack-hot-middleware/client?path=/" + appId + "__webpack_hmr&timeout=20000&reload=true");
		config.entry.main.unshift("eventsource-polyfill");

		// Disable git adding
		appConfig.disableGitAdd = true;

		// Require plugins only if required
		const webpack = require("webpack");

		// Require support for hot module replacement
		config.plugins.push(new webpack.HotModuleReplacementPlugin());

		// Done
		return config;
	}
};