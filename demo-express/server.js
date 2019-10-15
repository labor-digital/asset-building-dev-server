const expressAssetBuildingPlugin = require("@labor/asset-building/dist/Express/expressAssetBuildingPlugin.js");
const expressDevServerPlugin = require("@labor/asset-building-dev-server/dist/expressDevServerPlugin.js");
const express = require("express");
const app = express();
const port = 8000;

// Demo for environment setting
if (process.argv[2] === "development") process.env.NODE_ENV = "development";

// Apply the dev server plugin to the app
expressAssetBuildingPlugin(app)
	.then(expressDevServerPlugin)
	.then(() => {
		app.get("/", (req, res) => {
			res.send("Not served by dev server!");
		});
		app.listen(port, () => console.log(`Example app listening on port ${port}!`));
	});
