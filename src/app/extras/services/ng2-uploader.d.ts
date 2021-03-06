import { EventEmitter } from '@angular/core'
export declare class UploadedFile {
    id: string
    status: number
    statusText: string
    progress: Object
    originalName: string
    size: number
    response: string
    done: boolean
    error: boolean
    abort: boolean
    constructor(id: string, originalName: string, size: number)
    setProgres(progress: Object): void
    setError(): void
    setAbort(): void
    onFinished(status: number, statusText: string, response: string): void
}
export declare class Ng2Uploader {
    url: string
    cors: boolean
    withCredentials: boolean
    multiple: boolean
    maxUploads: number
    allowedExtensions: string[]
    maxSize: boolean
    data: Object
    noParams: boolean
    autoUpload: boolean
    multipart: boolean
    method: string
    debug: boolean
    customHeaders: any
    encodeHeaders: boolean
    authTokenPrefix: string
    authToken: string
    fieldName: string
    _queue: any[]
    _emitter: EventEmitter<any>
    setOptions(options: any): void
    uploadFilesInQueue(): void
    uploadFile(file: any): void
    addFilesToQueue(files: FileList): void
    removeFileFromQueue(i: number): void
    clearQueue(): void
    getQueueSize(): number
    inQueue(file: any): boolean
    isFile(file: any): boolean
    log(msg: any): void
    generateRandomIndex(): string
}
