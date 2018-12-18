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
    "plugins": [
        "@labor/asset-building-dev-server/plugins/DevServerPlugin.js"
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