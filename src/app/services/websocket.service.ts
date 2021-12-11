import { Observer, Observable, of, Subject }    from 'rxjs'

import { Settings }                             from '../settings'

export class WebSocketService {

  public static URL: string = Settings.WS_SERVER

  private static __webSocketService: WebSocketService

  public path: string
  private _arg: string
  private _ws: WebSocket

  constructor(path: string) {

    this.path = path

    if (!path.startsWith("/"))
      path = "/" + path

    let url: string = WebSocketService.URL + path

    console.log("connecting to web-socket at: " + url)

    this._ws = new WebSocket(url)
  }

  public static default(path: string, arg?: string): WebSocketService {

    if (!this.__webSocketService || !this.__webSocketService.isActive() || this.__webSocketService.path != path || this.__webSocketService._arg != arg) {

      if (this.__webSocketService && this.__webSocketService.isActive())
        this.__webSocketService.close()

      this.__webSocketService = new WebSocketService(path)
    }

    return this.__webSocketService
  }

  public static closeDefault() {

    if (this.__webSocketService && this.__webSocketService.isActive())
        this.__webSocketService.close()
  }

  public isActive(): boolean {

    if (this._ws) {
      console.log("ws state is " + this._ws.readyState + " == " + WebSocket.OPEN + " or " + WebSocket.CONNECTING + " or " + WebSocket.CLOSING)

      return this._ws.readyState == WebSocket.OPEN
    } else {
      return false
    }
  }

  public send(message: string): Observable<boolean> {

     return this._send(message, 0)
  }

  private _send(message: string, retries: number): Observable<boolean> {

      if (this.isActive()) {
        this._ws.send(message)
        return of(true)
      } else if (retries < 5) {
        let ref: WebSocketService = this

        return Observable.create((observer: Observer<boolean>) => {

          setTimeout(() => {
            ref._send(message, retries++)
            observer.next(true)
            observer.complete()
          }, 200)
        })
      } else {
        return of(false)
      }
  }

  public listen(completionObserver?: Observable<any>): Observable<any> {

    return Observable.create((observer: Observer<any>) => {

      this._ws.onmessage = function (evt) {
        observer.next(evt.data)
      }

      this._ws.onclose = function() {
        observer.next("Log closed by server")
        observer.next(null)
        observer.complete()
      }

      this._ws.onerror = function(err) {
        observer.next(err)
        observer.next(null)
        observer.error(err)
      }

      if (completionObserver) {

        completionObserver.subscribe((info) => {

          observer.next(info)
          observer.next(null)

          setTimeout(() => {
            observer.complete()
          }, 500)
          }, (error) => {
            observer.next(error.message)
            observer.next(null)

            setTimeout(() => {
              observer.complete()
            }, 500)
          })
       }
    })
  }

  public close() {
    this._ws.close()
  }
}
