declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void
        Map: new (container: HTMLElement, options: Record<string, unknown>) => unknown
        LatLng: new (lat: number, lng: number) => unknown
        Marker: new (options: Record<string, unknown>) => unknown
        Polygon: new (options: Record<string, unknown>) => unknown
        CustomOverlay: new (options: Record<string, unknown>) => unknown
        Roadview: new (container: HTMLElement, options?: Record<string, unknown>) => unknown
        RoadviewClient: new () => unknown
        RoadviewOverlay: new () => unknown
        ZoomControl: new () => unknown
        ControlPosition: {
          RIGHT: unknown
          TOPRIGHT: unknown
        }
        MapTypeId: {
          ROADVIEW: unknown
        }
        event: {
          addListener: (target: unknown, type: string, handler: (...args: unknown[]) => void) => unknown
          removeListener: (target: unknown, type: string, handler: (...args: unknown[]) => void) => void
        }
        services: {
          Geocoder: new () => {
            addressSearch: (
              address: string,
              callback: (result: Array<Record<string, string>>, status: string) => void,
            ) => void
          }
          Places: new () => {
            keywordSearch: (
              keyword: string,
              callback: (result: Array<Record<string, string>>, status: string) => void,
            ) => void
          }
          Status: {
            OK: string
          }
        }
      }
    }
  }
}

export {}
