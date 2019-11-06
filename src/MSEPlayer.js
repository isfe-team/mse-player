// @ts-check
// @todo use `ts`

/**
 * @typedef {{type: string, error: any}} MSE_SDK_ERROR
 * @typedef {(buffers: Array<ArrayBuffer>) => Array<ArrayBuffer> | Promise<Array<ArrayBuffer>>} Transformer
 * for users, `files` is more meaningful, so I don't use `blobs`
 * @typedef {{ files?: Array<Blob>, mimeType?: string, onError?: Function, ignoreError?: boolean, transformer?: Transformer }} MSE_SDK_OPTION
 */

/**
 * readBuffer - read blobs and get arrayBuffers
 * @param {Array<Blob>} blobs
 * @returns {Promise<Array<ArrayBuffer>>}
 */
function read (blobs) {
  return Promise.all(blobs.map(function(blob) {
    return new Promise(function(resolve, reject) {
      // hmmm, no need to unbind, if it's smart enough
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        // @ts-ignore
        // the result must be `ArrayBuffer`
        resolve(reader.result)
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
 * @param {MediaSource} mediaSource 
 * @param {SourceBuffer} sourceBuffer 
 * @param {Array<ArrayBuffer>} buffers
 * @returns {Promise<void>} 
 */
function buffer (mediaSource, sourceBuffer, buffers) {
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
      sourceBuffer.appendBuffer(buffers.shift())
    }

    function onAppendError (err) {
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
 * @param {Array<File>} files
 * @param {MediaSource} mediaSource
 * @param {SourceBuffer} sourceBuffer
 * @param {Transformer} transformer
 */
function combine (files, mediaSource, sourceBuffer, transformer) {
  return read(files).then((buffers) => transformer(buffers)).then((buffers) => buffer(mediaSource, sourceBuffer, buffers))
}

/**
 * identity
 * @todo I don't know how to define the generic param of `Function`, so use `any` here
 * @param {Array<ArrayBuffer>} x
 * @returns {Array<ArrayBuffer>}
 */
function identity (x) {
  return x
}

/**
 * isFunction
 * @param {any} x
 * @returns {boolean}
 */
function isFunction (x) {
  return Object.prototype.toString.call(x) === '[object Function]'
}

/**
 * toArray
 * @todo I don't know how to define the generic param of `Function`, so use `any` here
 * @param {ArrayLike<any>} xs
 * @returns {Array<any>}
 */
function toArray (xs) {
  return [].slice.call(xs)
}

/**
 * genError
 * @param {string} type
 * @param {any} [error]
 * @returns {MSE_SDK_ERROR}
 */
function genError (type, error) {
  return {
    type,
    error
  }
}

export default class MSEPlayer {
  /**
   * constructor
   * @todo improve `typedef`
   * @param {object} [option]
   * @param {Array<File>} [option.files=[]] - files to play
   * @param {String} [option.mimeType='audio/mpeg'] - mimeType that MediaSource should be supported
   * @param {Function} [option.onError] - error callback, will be invoked when error occurred
   * @param {boolean} [option.ignoreError=true] - if true, when sth. is wrong, the following `append$` will go through
   * @param {Transformer} [option.transformer=identity] - a transformer that transform `ArrayBuffer` to `ArrayBuffer`
   * @example
   * const player = new MSEPlayer()
   * player.appendFiles(files)
   * @see https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API
   */
  // constructor ({ files = [], mimeType = 'audio/mpeg', onError, ignoreError = true, transformer = identity } = { }) {
  constructor (option) {
    const { files = [], mimeType = 'audio/mpeg', onError, ignoreError = true, transformer = identity } = option
    this.envSupported = MSEPlayer.checkEnvSupported()
  
    this.onError = (...args) => {
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

    const player = this
    function onSourceOpenWithPromise () {
      return new Promise((resolve) => {
        player.mediaSource.addEventListener('sourceopen', onSourceOpen)
        function onSourceOpen () {
          player.mediaSource.removeEventListener('sourceopen', onSourceOpen)
          player.sourceBuffer = player.mediaSource.addSourceBuffer(player.mimeType)
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
   * @param {Array<File>} files
   * @param {Transformer} [transformer=identity]
   * @param {boolean} [ignorePrevError=true]
   */
  appendFiles (files = [], transformer = identity, ignorePrevError = true) {
    files = toArray(files)

    if (ignorePrevError) {
      this.lastAppend$.catch(() => { })
    }

    /**
     * 
     * @param {Array<ArrayBuffer>} buffers
     * @returns {Promise<Array<ArrayBuffer>>}
     */
    const combinedTransformer = (buffers) => {
      return Promise.resolve(buffers)
        .then(transformer) // specific transformer
        .then((buffers) => this.transformer(buffers)) // common transformer
    }

    const currentAppend$ = this.lastAppend$.then(
      () => combine(files, this.mediaSource, this.sourceBuffer, combinedTransformer)
    )

    this.lastAppend$ = currentAppend$.catch((err) => {
      this.onError(genError('APPEND_ERROR', err))
    })

    return this.ignoreError ? this.lastAppend$ : currentAppend$
  }

  destroy () {
    this.files = null
    this.mediaSource = null
    this.sourceBuffer = null
  }
}
