/// <reference types="vite/client" />

// Leaflet PNG imports
declare module '*.png' {
  const value: string;
  export default value;
}

// Leaflet module
declare module 'leaflet' {
  export * from 'leaflet';
}

// leaflet-routing-machine
declare module 'leaflet-routing-machine' {
  import * as L from 'leaflet';
  namespace Routing {
    function control(options: any): any;
  }
  export = Routing;
}
