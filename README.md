# LABOR Asset Building - Dev Server
When it comes to developing Single page applications you will find out sooner or later that it is really handy to have a local dev server that supports stuff like "hot-module-replacement".

The problem with webpack's default dev-server was that it does not run propperly when using multiple apps in the same domain (frontend and backend for example). It also only works with real "webpack.js" files and not with the dynamic version we use.
To circumvent that, and to make the integration as smooth as possible I created our own dev server using express and webpack's middleware capabilities.

## Installation
* Use our private npm registry!
* Install our asset builder
`` npm install --save-dev @labor/asset-building ``
* Install the npm dependency
`` npm install --save-dev @labor/asset-building-dev-server ``
* Add the provider plugin to your package.json
```
{ 
    "builderVersion": 2,
    [...]
    "extensions": [
        "@labor/asset-building-dev-server"
    ]
}
```
* Add the following part to your package.json:
```
  "scripts": {
    [...]
    "dev": "labor-asset-building dev"
  }
```
* Start your server by running "npm run dev" -> The urls are printed to the console
* Done! :-)

## Adding the dev server to express apps
Our asset builder can run as a middleware for every express app, providing
hot module reloading in the same way the "dev" command does for virtually
every express app.

We provide a function you can use in your server.js file. It will only apply
the required middlewares if your NODE_ENV variable is set to "development".
Register the express plugin like:
```
const devServerPlugin = require("@labor/asset-building-dev-server/dist/ExpressDevServerPlugin");
const express = require("express");
const app = express();

// Apply the dev server plugin to the app
devServerPlugin(app).then(() => {
    // Your express setup goes here...
});
```