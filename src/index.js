'use strict'

const co = require('co')

module.exports = function (options) {
  return new Router(options || {})
}

function Router (options) {
  this.routes = []
  this.debug = options.debug
}

Router.prototype.addRoute = function (httpMethod, path, handler) {
  this.routes.push({method: httpMethod, path: path, handler: handler, isRegex: (path instanceof RegExp)})
}

function wrapRoute (httpMethod, args) {
  return this.addRoute.apply(this, [httpMethod].concat(Array.prototype.slice.call(args)))
}

Router.prototype.get = function () {
  return wrapRoute.call(this, 'GET', arguments)
}
Router.prototype.post = function () {
  return wrapRoute.call(this, 'POST', arguments)
}
Router.prototype.put = function () {
  return wrapRoute.call(this, 'PUT', arguments)
}
Router.prototype['delete'] = function () {
  return wrapRoute.call(this, 'DELETE', arguments)
}

Router.prototype.unknown = function (handler) {
  this.unknownRoute = {
    unknown: true,
    handler: handler
  }
}

Router.prototype.log = function () {
  if (this.debug) {
    console.log.apply(console, arguments)
  }
}

function getRoute (self, event) {
  const method = event.method || event.httpMethod
  const eventPath = event.resource || event.resourcePath || event.path

  const route = self.routes.find(route => {
    return doesPathMatch(eventPath, route) && method === route.method
  })

  return route || self.unknownRoute || { handler: defaultUnknownRoute }
}

function doesPathMatch (eventPath, route) {
  // Confirm fast if they're a direct match
  if (eventPath === route.path) return true

  const eventPathParts = eventPath.split('/')
  const routePathParts = route.path.split('/')

  // Fail fast if they're not the same length
  if (eventPathParts.length !== routePathParts.length) return false

  // Start with 1 because the url should always start with the first back slash
  for (let i = 1; i < eventPathParts.length; ++i) {
    const pathPart = eventPathParts[i]
    const routePart = routePathParts[i]

    // If the part is a curly braces value
    if (routePart.search(/\{([a-z0-9]+)}/g) !== -1) {
      continue
    }

    // Fail fast if a part doesn't match
    if (routePart !== pathPart) {
      return false
    }
  }

  return true
}

function defaultUnknownRoute (event) {
  console.log('No unknown router or route provided for event: ' + JSON.stringify(event))
  throw new Error('No route specified.')
}

Router.prototype.route = function (event, context) {
  let self = this
  self.log('Routing event', event)

  return co(function * () {
    let matchedRoute = getRoute(self, event)
    self.log('Matched on route', matchedRoute)
    return matchedRoute.handler(event, context)
  }).catch(error => {
    self.log('Route error: ', error)
    throw error
  })
}
