// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface MSESdkError<T = any> {
  type: string;
  error?: T;
}

interface Transformer {
  (buffers: Array<ArrayBuffer>): Array<ArrayBuffer> | Promise<Array<ArrayBuffer>>;
}

interface MSESdkOption {
  // for users, `files` is more meaningful, so I don't use `blobs`
  files?: Array<Blob>;
  mimeType?: string;
  onError?: Function;
  ignoreError?: boolean;
  transformer?: Transformer;
}

/**
 * @example
 * const player = new MSEPlayer()
 * player.appendFiles(files)
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API
 */
export default class MSEPlayer {
  envSupported: boolean
  onError: Function
  mimeType!: string
  sourceBuffer!: SourceBuffer | null
  ignoreError!: boolean
  transformer!: Transformer
  mediaSource!: MediaSource | null
  lastAppend$!: Promise<void>
  constructor (option: MSESdkOption = { }) {
    const { files = [], mimeType = 'audio/mpeg', onError, ignoreError = true, transformer = identity } = option
    this.envSupported = MSEPlayer.checkEnvSupported()
  
    this.onError = (...args: any[]) => {
      if (isFunction(onError)) {
        onError.call(this, ...args)
      }
    }

    if (!this.envSupported) {
      this.onError(genError('MEDIA_SOURCE_NOT_SUPPORTED'))
      return
    }

    if (!MediaSource.isTypeSupported(mimeType)) {
      this.onError(genError('MIME_TYPE_NOT_SUPPORTED'))
      return
    }

    this.mimeType = mimeType
    this.sourceBuffer = null
    this.ignoreError = ignoreError
    this.transformer = transformer
    this.mediaSource = new MediaSource()

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const player = this
    function onSourceOpenWithPromise (): Promise<void> {
      return new Promise((resolve) => {
        const mediaSource: MediaSource = player.mediaSource as MediaSource
        mediaSource.addEventListener('sourceopen', onSourceOpen)
        function onSourceOpen () {
          mediaSource.removeEventListener('sourceopen', onSourceOpen)
          player.sourceBuffer = mediaSource.addSourceBuffer(player.mimeType)
          resolve()
        }
      })
    }

    this.lastAppend$ = onSourceOpenWithPromise()

    if (files.length > 0) {
      this.appendFiles(files)
    }
  }

  static checkEnvSupported () {
    return 'MediaSource' in window
  }

  /**
   * appendFiles
   */
  appendFiles (files: Array<Blob> = [], transformer: Transformer = identity, ignorePrevError = true) {
    files = toArray(files)

    if (ignorePrevError) {
      this.lastAppend$.catch(() => { })
    }

    const combinedTransformer = (buffers: Array<ArrayBuffer>) => {
      return Promise.resolve(buffers)
        .then(transformer) // specific transformer
        .then((buffers) => this.transformer(buffers)) // common transformer
    }

    const currentAppend$ = this.lastAppend$.then(
      () => combine(files, this.mediaSource as MediaSource, this.sourceBuffer as SourceBuffer, combinedTransformer)
    )

    this.lastAppend$ = currentAppend$.catch((err) => {
      this.onError(genError('APPEND_ERROR', err))
    })

    return this.ignoreError ? this.lastAppend$ : currentAppend$
  }

  destroy () {
    this.mediaSource = null
    this.sourceBuffer = null
  }
}

/**
 * readBuffer - read blobs and get arrayBuffers
 */
function read (blobs: Array<Blob>): Promise<Array<ArrayBuffer>> {
  return Promise.all(blobs.map(function(blob) {
    return new Promise<ArrayBuffer>(function(resolve, reject) {
      // hmmm, no need to unbind, if it's smart enough
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        // the result must be `ArrayBuffer`
        resolve(reader.result as ArrayBuffer)
      })
      reader.readAsArrayBuffer(blob)
      reader.addEventListener('error', (err) => {
        reject(genError('READ_FILE_ERROR', err))
      })
    })
  }))
}

/**
 * buffer - append buffers to specific sourceBuffer
 */
function buffer (mediaSource: MediaSource, sourceBuffer: SourceBuffer, buffers: Array<ArrayBuffer>): Promise<void> {
  return new Promise((resolve, reject) => {
    sourceBuffer.addEventListener('updateend', onUpdateEnd)
    sourceBuffer.addEventListener('error', onAppendError)

    // it's async when `appendBuffer`,
    // we should use `updateend` event(triggers when `append` or `removed`) to ensure the orders
    function onUpdateEnd () {
      if (buffers.length === 0) {
        mediaSource.endOfStream()
        // don't forget to remove
        sourceBuffer.removeEventListener('updateend', onUpdateEnd)
        sourceBuffer.removeEventListener('error', onAppendError)
        resolve()
        return
      }
      sourceBuffer.appendBuffer(buffers.shift() as ArrayBuffer)
    }

    function onAppendError (err: any) {
      // no need to unbind `updateend` and invoke `endOfStream` here,
      // because when `error` occurs, `updateend` will go according to the spec.
      // @see https://w3c.github.io/media-source/#sourcebuffer-append-error
      reject(genError('APPEND_BUFFER_ERROR', err))
    }

    // trigger first buffer
    onUpdateEnd()
  })
}

/**
 * combine - combine the `read` process and the `buffer` process
 * to ensure the `read` process is excuted before the `buffer` process.
 * just a combination.
 */
function combine (files: Array<Blob>, mediaSource: MediaSource, sourceBuffer: SourceBuffer, transformer: Transformer) {
  return read(files).then((buffers) => transformer(buffers)).then((buffers) => buffer(mediaSource, sourceBuffer, buffers))
}

/**
 * identity
 */
function identity<T> (x: T) {
  return x
}

/**
 * isFunction
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isFunction (x: any): x is Function {
  return Object.prototype.toString.call(x) === '[object Function]'
}

/**
 * toArray
 */
function toArray<T> (xs: ArrayLike<T>): Array<T> {
  return [].slice.call(xs)
}

/**
 * genError
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function genError<T = any> (type: string, error?: T): MSESdkError<T> {
  return {
    type,
    error
  }
}
