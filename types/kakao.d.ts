declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void
        Map: new (container: HTMLElement, options: any) => any
        LatLng: new (lat: number, lng: number) => any
        Marker: new (options: any) => any
        ZoomControl: new () => any
        ControlPosition: {
          RIGHT: unknown
        }
        services: {
          Geocoder: new () => any
          Status: {
            OK: string
          }
        }
      }
    }
  }
}

export {}
