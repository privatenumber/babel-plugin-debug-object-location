const apiName = "objectRegistry";
const initialize = (context) => {
  const api = {
    registry: /* @__PURE__ */ new Map(),
    find(query) {
      const { registry } = this;
      for (const [object, filePath] of registry) {
        if (object === query) {
          return filePath;
        }
      }
      const matches = [];
      if (Array.isArray(query)) {
        for (const [array, filePath] of registry) {
          if (Array.isArray(array)) {
            const elementsMatch = query.every((value) => array.includes(value));
            if (elementsMatch) {
              matches.push([array, filePath]);
            }
          }
        }
      } else {
        const findObjectKeys = Object.keys(query);
        for (const [object, filePath] of registry) {
          const keysMatch = findObjectKeys.every((key) => object[key] === query[key]);
          if (keysMatch) {
            matches.push([object, filePath]);
          }
        }
      }
      return matches;
    }
  };
  context[apiName] = api;
  return api;
};
const register = (object, filePath) => {
  let topGlobal = globalThis;
  while (topGlobal.parent && topGlobal.parent !== topGlobal) {
    topGlobal = topGlobal.parent;
  }
  let api = topGlobal[apiName];
  if (!api) {
    api = initialize(topGlobal);
  }
  api.registry.set(object, filePath);
  return object;
};

export { register as default };
