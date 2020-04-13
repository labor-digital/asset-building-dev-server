# LABOR - Asset Building - Dev Server Extension
**This package is an extension to our [asset building bundle](https://www.npmjs.com/package/@labor-digital/asset-building).**

When it comes to developing Single page applications (SPAs), you will find out sooner or later that it is convenient to have a local dev server that supports stuff like "hot-module-replacement".

The problem with webpack's default dev-server was, it does not work correctly when multiple apps run in the same domain (frontend and backend, for example). It also only works with real "webpack.js" files and not with the dynamic version we use.
To circumvent that, and to make the integration as smooth as possible, we created our own dev server using express and webpack's middleware capabilities.

## Installation
* Install our asset builder:
``` 
npm install --save-dev @labor-digital/asset-building
```
* Install the npm dependency:
```
npm install --save-dev @labor-digital/asset-building-dev-server
```
* Add the provider plugin to your package.json
```
{ 
    "builderVersion": 2,
    [...]
    "extensions": [
        "@labor-digital/asset-building-dev-server"
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

Register the express plugin in your index.js like:
```
const devServerPlugin = require("@labor-digital/asset-building-dev-server/dist/ExpressDevServerPlugin");
const express = require("express");
const app = express();

// Apply the dev server plugin to the app
devServerPlugin(app).then(() => {
    // Your express - app setup goes here...
});
```

## Changing the visible URL in the console
By default, the console will show a URL like http://js.localmachine.space:9999 when you are launching a new instance of a project. If you want to change the URL, you can do so by adding the "devUrl" option to your labor configuration in your package.json. The {{port}} placeholder
will automatically be replaced with the correct port of your application.
```
{
    [...]
    "labor": {
        "devUrl": "http://yourUrl:{{port}}"
    }
}
```

## Whats xyz.localmachine.space?
To work locally, you can work with an IP like 127.0.0.1, localhost, or you can point a DNS record to your local machine. 
The localmachine.space domain is precisely that. It is a domain name that always points to "127.0.0.1", no matter what subdomain you use.
Its a helper to make dev URLs easier to read; it works on every machine as long as you have an internet connection.

## Postcardware
You're free to use this package, but if it makes it to your production environment, we highly appreciate you sending us a postcard from your hometown, mentioning which of our package(s) you are using.

Our address is: LABOR.digital - Fischtorplatz 21 - 55116 Mainz, Germany.

We publish all received postcards on our [company website](https://labor.digital). 
