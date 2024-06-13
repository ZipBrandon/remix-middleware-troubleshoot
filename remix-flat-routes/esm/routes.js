import * as path from 'path';
/**
 * A function for defining routes programmatically, instead of using the
 * filesystem convention.
 */
export function defineRoutes(callback) {
    let routes = Object.create(null);
    let parentRoutes = [];
    let alreadyReturned = false;
    let defineRoute = (path, file, optionsOrChildren, children) => {
        if (alreadyReturned) {
            throw new Error('You tried to define routes asynchronously but started defining ' +
                'routes before the async work was done. Please await all async ' +
                'data before calling `defineRoutes()`');
        }
        let options;
        if (typeof optionsOrChildren === 'function') {
            // route(path, file, children)
            options = {};
            children = optionsOrChildren;
        }
        else {
            // route(path, file, options, children)
            // route(path, file, options)
            options = optionsOrChildren || {};
        }
        let route = {
            path: path ? path : undefined,
            index: options.index ? true : undefined,
            caseSensitive: options.caseSensitive ? true : undefined,
            id: options.id || createRouteId(file),
            parentId: parentRoutes.length > 0
                ? parentRoutes[parentRoutes.length - 1].id
                : 'root',
            file,
        };
        if (route.id in routes) {
            throw new Error(`Unable to define routes with duplicate route id: "${route.id}"`);
        }
        routes[route.id] = route;
        if (children) {
            parentRoutes.push(route);
            children();
            parentRoutes.pop();
        }
    };
    callback(defineRoute);
    alreadyReturned = true;
    return routes;
}
export function createRouteId(file) {
    return normalizeSlashes(stripFileExtension(file));
}
export function normalizeSlashes(file) {
    return file.split(path.win32.sep).join('/');
}
function stripFileExtension(file) {
    return file.replace(/\.[a-z0-9]+$/i, '');
}
