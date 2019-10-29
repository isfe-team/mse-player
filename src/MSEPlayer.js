/**
 * readBuffer - 将文件转写成arrayBuffer格式
 * @param {Array<File>} files 
 * @returns {Promise<Array<ArrayBuffer>>}
 */
function read (files) {
  return Promise.all(files.map(function(file) {
    return new Promise(function(resolve, reject) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        resolve(reader.result)
      })
      reader.readAsArrayBuffer(file)
      reader.addEventListener('error', (err) => {
        reject(genError('READ_FILE_ERROR', err))
      })
    })
  }))
}

/**
 * buffer - 将拿到的buffer添加到sourceBuffer里面
 * @param {MediaSource} mediaSource 
 * @param {SourceBuffer} sourceBuffer 
 * @param {Array<ArrayBuffer>} buffers
 * @returns {Promise<void>} 
 */
function buffer (mediaSource, sourceBuffer, buffers) {
  return new Promise((resolve) => {
    sourceBuffer.addEventListener('updateend', onUpdateEnd)
    // appendBuffer 也是一个异步的过程，完成前不能添加下一段资源，所以利用updateend事件(append或remove完成时会触发)
    function onUpdateEnd () {
      if (buffers.length === 0) {
        mediaSource.endOfStream()
        sourceBuffer.removeEventListener('updateend', onUpdateEnd)
        resolve()
        return
      }
      sourceBuffer.appendBuffer(buffers.shift())
    }
    sourceBuffer.addEventListener('error', (err) => {
      // 此时不需额外解绑updateend和调用endOfStream，因为err事件执行后还会继续执行updateend
      // @see https://w3c.github.io/media-source/#sourcebuffer-append-error
      reject('APPEND_BUFFER_ERROR', err)
    })
    onUpdateEnd()
  })
}

/**
 * combine - 结合read和buffer函数，且确保buffer在read执行完成之后执行
 * @param {Array<File>} files 
 * @param {MediaSource} mediaSource 
 * @param {SourceBuffer} sourceBuffer 
 */
function combine (files, mediaSource, sourceBuffer, transformer) {
  return read(files)
          .then((buffers) => transformer(buffers))
          .then((buffers) => buffer(mediaSource, sourceBuffer, buffers))
}

function id (x) {
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
 * @param {ArrayLike<T>} xs
 * @returns {Array<T>}
 */
function toArray (xs) {
  return [].slice.call(xs)
}

/**
 * genError
 * @param {string} type 
 * @param {any} error 
 */
function genError (type, error) {
  return {
    type,
    error
  }
}

export default class MSEPlayer {
  /**
   * @param {{ files: Array, mimeType: string, onError: Function, ignoreError: boolean, transformer: Function }} option
   * @param {Array} [option.files=[]] - 播放的文件列表,可以一次传一个也可以一次传多个
   * @param {String} [option.mimeType='audio/mpeg'] - sourceBuffer支持的MimeType格式
   * @param {Function} [option.onError] - 异常发生啥要做的事
   * @param {boolean} [option.ignoreError=true] - 当异常发生时是否忽略它继续向下走
   * @param {Function} [option.transformer] - 转换函数，用户可提供一个转换函数将file转成你想要的格式,比如wav转mp3
   * @example
   * const player = new MSEPlayer()
   * player.appendFiles(files)
   * @see https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API
   */
  constructor ({ files = [], mimeType = 'audio/mpeg', onError, ignoreError = true, transformer = id } = { }) {
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

    this.lastAppend$ = onSourceOpenWithPromise(player.mediaSource)

    if (files.length > 0) {
      this.appendFiles(files)
    }
  }

  static checkEnvSupported () {
    return 'MediaSource' in window
  }

  appendFiles (files = [], ignorePrevError = true) {
    if (ignorePrevError) {
      this.lastAppend$.catch(() => { })
    }
    files = toArray(files)
    const currentAppend$ = this.lastAppend$.then(() => combine(files, this.mediaSource, this.sourceBuffer, this.transformer))

    this.lastAppend$ = currentAppend$.catch((err) => {
      this.onError(err)
    })

    return this.ignoreError ? this.lastAppend$ : currentAppend$
  }

  destroy () {
    this.files = null
    this.mediaSource = null
    this.sourceBuffer = null
  }
}
