import * as fs from "fs";
import { minimatch } from "minimatch";
import * as path from "path";

export { flatRoutes };
const defaultOptions = {
  appDir: `app`,
  routeDir: `routes`,
  basePath: `/`,
  paramPrefixChar: `$`,
  nestedFolderChar: `+`,
  routeRegex: (options) => {
    const { nestedFolderChar } = options;
    return new RegExp(
      `(([${nestedFolderChar}][\\/\\\\][^\\/\\\\:?*]+)|[\\/\\\\]((index|route|layout|page)|(_[^\\/\\\\:?*]+)|([^\\/\\\\:?*]+\\.route)))\\.(ts|tsx|js|jsx|md|mdx)$$`,
    );
  },
};
const defaultDefineRoutes = undefined;
export default function flatRoutes(routeDir, defineRoutes, options = {}) {
  var _a, _b;
  const routes = _flatRoutes(
    (_a = options.appDir) !== null && _a !== void 0 ? _a : defaultOptions.appDir,
    (_b = options.ignoredRouteFiles) !== null && _b !== void 0 ? _b : [],
    {
      ...defaultOptions,
      ...options,
      routeDir,
      defineRoutes,
    },
  );

  // update undefined parentIds to 'root'
  Object.values(routes).forEach((route) => {
    if (route.parentId === undefined) {
      route.parentId = `root`;
    }
  });
  return routes;
}
// this function uses the same signature as the one used in core remix
// this way we can continue to enhance this package and still maintain
// compatibility with remix
function _flatRoutes(appDir, ignoredFilePatternsOrOptions, options) {
  var _a, _b, _c, _d;
  // get options
  let ignoredFilePatterns = [];
  if (ignoredFilePatternsOrOptions && !Array.isArray(ignoredFilePatternsOrOptions)) {
    options = ignoredFilePatternsOrOptions;
  } else {
    ignoredFilePatterns =
      ignoredFilePatternsOrOptions !== null && ignoredFilePatternsOrOptions !== void 0
        ? ignoredFilePatternsOrOptions
        : [];
  }
  if (!options) {
    options = defaultOptions;
  }
  let routeMap = new Map();
  let nameMap = new Map();
  let routeDirs = Array.isArray(options.routeDir)
    ? options.routeDir
    : [(_a = options.routeDir) !== null && _a !== void 0 ? _a : `routes`];
  let defineRoutes =
    (_b = options.defineRoutes) !== null && _b !== void 0 ? _b : defaultDefineRoutes;
  if (!defineRoutes) {
    throw new Error(`You must provide a defineRoutes function`);
  }
  let visitFiles = (_c = options.visitFiles) !== null && _c !== void 0 ? _c : defaultVisitFiles;
  // let routeRegex = options.routeRegex ?? defaultOptions.routeRegex!
  const routeRegex = getRouteRegex(
    (_d = options.routeRegex) !== null && _d !== void 0 ? _d : defaultOptions.routeRegex,
    options,
  );
  for (let routeDir of routeDirs) {
    visitFiles(path.join(appDir, routeDir), (file) => {
      if (
        ignoredFilePatterns &&
        ignoredFilePatterns.some((pattern) => minimatch(file, pattern, { dot: true }))
      ) {
        return;
      }

      if (isRouteModuleFile(file, routeRegex)) {
        /*        if (
          !file.endsWith(`_route.ts`) &&
          !file.endsWith(`_route.tsx`) &&
          !file.endsWith(`_layout.tsx`) &&
          !file.endsWith(`_loader.ts`) &&
          !file.endsWith(`_redirect.ts`) &&
          !file.endsWith(`_redirect.tsx`) &&
          !file.endsWith(`_render.ts`) &&
          !file.endsWith(`_render.tsx`) &&
          !file.endsWith(`_loader.tsx`) &&
          !file.endsWith(`_action.tsx`) &&
          !file.endsWith(`_action.ts`)
        ) {
          // console.log(routeRegex);
          console.log(`file`, isRouteModuleFile(file, routeRegex), file);
        }*/
        let routeInfo = getRouteInfo(routeDir, file, options);
        routeMap.set(routeInfo.id, routeInfo);
        nameMap.set(routeInfo.name, routeInfo);
        return;
      }
    });
  }
  // update parentIds for all routes
  Array.from(routeMap.values()).forEach((routeInfo) => {
    let parentId = findParentRouteId(routeInfo, nameMap);
    routeInfo.parentId = parentId;
  });
  // Then, recurse through all routes using the public defineRoutes() API
  function defineNestedRoutes(defineRoute, parentId) {
    var _a, _b, _c;
    let childRoutes = Array.from(routeMap.values()).filter(
      (routeInfo) => routeInfo.parentId === parentId,
    );
    let parentRoute = parentId ? routeMap.get(parentId) : undefined;
    let parentRoutePath =
      (_a = parentRoute === null || parentRoute === void 0 ? void 0 : parentRoute.path) !== null &&
      _a !== void 0
        ? _a
        : `/`;
    for (let childRoute of childRoutes) {
      let routePath =
        (_c =
          (_b = childRoute === null || childRoute === void 0 ? void 0 : childRoute.path) === null ||
          _b === void 0
            ? void 0
            : _b.slice(parentRoutePath.length)) !== null && _c !== void 0
          ? _c
          : ``;
      // remove leading slash
      if (routePath.startsWith(`/`)) {
        routePath = routePath.slice(1);
      }
      let index = childRoute.index;
      if (index) {
        let invalidChildRoutes = Object.values(routeMap).filter(
          (routeInfo) => routeInfo.parentId === childRoute.id,
        );
        if (invalidChildRoutes.length > 0) {
          throw new Error(
            `Child routes are not allowed in index routes. Please remove child routes of ${childRoute.id}`,
          );
        }
        defineRoute(routePath, routeMap.get(childRoute.id).file, {
          index: true,
        });
      } else {
        defineRoute(routePath, routeMap.get(childRoute.id).file, () => {
          defineNestedRoutes(defineRoute, childRoute.id);
        });
      }
    }
  }
  let routes = defineRoutes(defineNestedRoutes);
  return routes;
}
const routeModuleExts = [`.js`, `.jsx`, `.ts`, `.tsx`, `.md`, `.mdx`];
const serverRegex = /\.server\.(ts|tsx|js|jsx|md|mdx)$/;
export function isRouteModuleFile(filename, routeRegex) {
  // flat files only need correct extension
  let isFlatFile = !filename.includes(path.sep);
  if (isFlatFile) {
    return routeModuleExts.includes(path.extname(filename));
  }
  let isRoute = routeRegex.test(filename);
  if (isRoute) {
    // check to see if it ends in .server.tsx because you may have
    // a _route.tsx and and _route.server.tsx and only the _route.tsx
    // file should be considered a route
    let isServer = serverRegex.test(filename);
    return !isServer;
  }
  return false;
}
const memoizedRegex = (() => {
  const cache = {};
  return (input) => {
    if (input in cache) {
      return cache[input];
    }
    const newRegex = new RegExp(input);
    cache[input] = newRegex;
    return newRegex;
  };
})();
export function isIndexRoute(routeId, options) {
  const indexRouteRegex = memoizedRegex(
    `((^|[.]|[${options.nestedFolderChar}]\\/)(index|_index))(\\/[^\\/]+)?$|(\\/_?index\\/)`,
  );
  return indexRouteRegex.test(routeId);
}
export function getRouteInfo(routeDir, file, options) {
  let filePath = normalizeSlashes(path.join(routeDir, file));
  let routeId = createRouteId(filePath);
  let routeIdWithoutRoutes = routeId.slice(routeDir.length + 1);
  let index = isIndexRoute(routeIdWithoutRoutes, options);
  let routeSegments = getRouteSegments(
    routeIdWithoutRoutes,
    index,
    options.paramPrefixChar,
    options.nestedFolderChar,
  );
  let routePath = createRoutePath(routeSegments, index, options);
  let routeInfo = {
    id: routeId,
    path: routePath,
    file: filePath,
    name: routeSegments.join(`/`),
    segments: routeSegments,
    index,
  };
  return routeInfo;
}
// create full path starting with /
export function createRoutePath(routeSegments, index, options) {
  var _a, _b;
  let result = ``;
  let basePath = (_a = options.basePath) !== null && _a !== void 0 ? _a : `/`;
  let paramPrefixChar = (_b = options.paramPrefixChar) !== null && _b !== void 0 ? _b : `$`;
  if (index) {
    // replace index with blank
    routeSegments[routeSegments.length - 1] = ``;
  }
  for (let i = 0; i < routeSegments.length; i++) {
    let segment = routeSegments[i];
    // skip pathless layout segments
    if (segment.startsWith(`_`)) {
      continue;
    }
    // remove trailing slash
    if (segment.endsWith(`_`)) {
      segment = segment.slice(0, -1);
    }
    // handle param segments: $ => *, $id => :id
    if (segment.startsWith(paramPrefixChar)) {
      if (segment === paramPrefixChar) {
        result += `/*`;
      } else {
        result += `/:${segment.slice(1)}`;
      }
      // handle optional segments with param: ($segment) => :segment?
    } else if (segment.startsWith(`(${paramPrefixChar}`)) {
      result += `/:${segment.slice(2, segment.length - 1)}?`;
      // handle optional segments: (segment) => segment?
    } else if (segment.startsWith(`(`)) {
      result += `/${segment.slice(1, segment.length - 1)}?`;
    } else {
      result += `/${segment}`;
    }
  }
  if (basePath !== `/`) {
    result = basePath + result;
  }
  return result || undefined;
}
function findParentRouteId(routeInfo, nameMap) {
  let parentName = routeInfo.segments.slice(0, -1).join(`/`);
  while (parentName) {
    if (nameMap.has(parentName)) {
      return nameMap.get(parentName).id;
    }
    parentName = parentName.substring(0, parentName.lastIndexOf(`/`));
  }
  return undefined;
}
export function getRouteSegments(name, index, paramPrefixChar = `$`, nestedFolderChar = `+`) {
  var _a;
  let routeSegments = [];
  let i = 0;
  let routeSegment = ``;
  let state = `START`;
  let subState = `NORMAL`;
  let hasPlus = false;
  // name has already been normalized to use / as path separator
  const escapedNestedFolderChar = nestedFolderChar.replace(/[.*+\-?^${}()|[\]\\]/g, `\\$&`);
  const combinedRegex = new RegExp(`${escapedNestedFolderChar}[/\\\\]`, `g`);
  const testRegex = new RegExp(`${escapedNestedFolderChar}[/\\\\]`);
  const replacePattern = `${escapedNestedFolderChar}/_\\.`;
  const replaceRegex = new RegExp(replacePattern);
  // replace `+/_.` with `_+/`
  // this supports ability to to specify parent folder will not be a layout
  // _public+/_.about.tsx => _public_.about.tsx
  if (replaceRegex.test(name)) {
    const replaceRegexGlobal = new RegExp(replacePattern, `g`);
    name = name.replace(replaceRegexGlobal, `_${nestedFolderChar}/`);
  }
  // replace `+/` with `.`
  // this supports folders for organizing flat-files convention
  // _public+/about.tsx => _public.about.tsx
  //
  if (testRegex.test(name)) {
    name = name.replace(combinedRegex, `.`);
    hasPlus = true;
  }
  let hasFolder = /\//.test(name);
  // if name has plus folder, but we still have regular folders
  // then treat ending route as flat-folders
  if (((hasPlus && hasFolder) || !hasPlus) && !name.endsWith(`.route`)) {
    // do not remove segments ending in .route
    // since these would be part of the route directory name
    // docs/readme.route.tsx => docs/readme
    // remove last segment since this should just be the
    // route filename and we only want the directory name
    // docs/_layout.tsx => docs
    let last = name.lastIndexOf(`/`);
    if (last >= 0) {
      name = name.substring(0, last);
    }
  }
  let pushRouteSegment = (routeSegment) => {
    if (routeSegment) {
      routeSegments.push(routeSegment);
    }
  };
  while (i < name.length) {
    let char = name[i];
    switch (state) {
      case `START`:
        // process existing segment
        if (
          routeSegment.includes(paramPrefixChar) &&
          !(
            routeSegment.startsWith(paramPrefixChar) ||
            routeSegment.startsWith(`(${paramPrefixChar}`)
          )
        ) {
          throw new Error(
            `Route params must start with prefix char ${paramPrefixChar}: ${routeSegment}`,
          );
        }
        if (
          routeSegment.includes(`(`) &&
          !routeSegment.startsWith(`(`) &&
          !routeSegment.endsWith(`)`)
        ) {
          throw new Error(`Optional routes must start and end with parentheses: ${routeSegment}`);
        }
        pushRouteSegment(routeSegment);
        routeSegment = ``;
        state = `PATH`;
        continue; // restart without advancing index
      case `PATH`:
        if (isPathSeparator(char) && subState === `NORMAL`) {
          state = `START`;
          break;
        } else if (char === `[`) {
          subState = `ESCAPE`;
          break;
        } else if (char === `]`) {
          subState = `NORMAL`;
          break;
        }
        routeSegment += char;
        break;
    }
    i++; // advance to next character
  }
  // process remaining segment
  pushRouteSegment(routeSegment);
  // strip trailing .route segment
  if (routeSegments.at(-1) === `route`) {
    routeSegments = routeSegments.slice(0, -1);
  }
  // if hasPlus, we need to strip the trailing segment if it starts with _
  // and route is not an index route
  // this is to handle layouts in flat-files
  // _public+/_layout.tsx => _public.tsx
  // _public+/index.tsx => _public.index.tsx
  if (
    !index &&
    hasPlus &&
    ((_a = routeSegments.at(-1)) === null || _a === void 0 ? void 0 : _a.startsWith(`_`))
  ) {
    routeSegments = routeSegments.slice(0, -1);
  }
  return routeSegments;
}
const pathSeparatorRegex = /[\/\\.]/;
function isPathSeparator(char) {
  return pathSeparatorRegex.test(char);
}
export function defaultVisitFiles(dir, visitor, baseDir = dir) {
  for (let filename of fs.readdirSync(dir)) {
    let file = path.resolve(dir, filename);
    let stat = fs.lstatSync(file);
    if (stat.isDirectory()) {
      defaultVisitFiles(file, visitor, baseDir);
    } else if (stat.isFile()) {
      visitor(path.relative(baseDir, file));
    }
  }
}
export function createRouteId(file) {
  return normalizeSlashes(stripFileExtension(file));
}
export function normalizeSlashes(file) {
  return file.split(path.win32.sep).join(`/`);
}
function stripFileExtension(file) {
  return file.replace(/\.[a-z0-9]+$/i, ``);
}
const getRouteRegex = (regexOrOptions, options) => {
  if (regexOrOptions instanceof RegExp) {
    return regexOrOptions;
  }
  return regexOrOptions(options);
};
