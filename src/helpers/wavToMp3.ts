/**
 * use [lamejs](https://github.com/zhuker/lamejs#real-example) to encode mp3
 * 
 * BE CARE, if use rollup to import lamejs, you will fail, so you need to use
 * [rollup-plugin-external-globals](https://github.com/eight04/rollup-plugin-external-globals)
 * ```js
 * // simple rollup config
 * const config = {
 *   plugins: [nodeResolve(), commonjs(), rollupTypescript(), externalGlobals({ lamejs: 'lamejs' })]
 * }
 * ```
 * @todo
 *  - [ ] pcmToMp3
 */

import lamejs from 'lamejs'
import readAsArrayBuffer$ from './readAsArrayBuffer$'

export default function wavToMp3 (
  mp3enc: lamejs.Mp3Encoder,
  buffers: Array<ArrayBuffer>,
  {
    kbps = 128,
    flush = true,
    optimize = false // if optimize, we'll slice into pieces, but it will result in unbelivable result
  } = { }
): Promise<Array<ArrayBuffer>> {
  return Promise.all<ArrayBuffer>(buffers.map((buf) => {
    const wav = lamejs.WavHeader.readHeader(new DataView(buf))
    const samples = new Int16Array(buf, wav.dataOffset, wav.dataLen / 2)
    const buffer = [ ]

    if (!mp3enc) {
      mp3enc = new lamejs.Mp3Encoder(wav.channels, wav.sampleRate, kbps)
    }

    if (optimize) {
      let remaining = samples.length
      const maxSamples = 1152
      for (let i = 0; remaining >= maxSamples; i += maxSamples) {
        const mono = samples.subarray(i, i + maxSamples)
        const mp3buf = mp3enc.encodeBuffer(mono)
        if (mp3buf.length > 0) {
          buffer.push(new Int8Array(mp3buf))
        }
        remaining -= maxSamples
      }
    } else {
      const mp3buf = mp3enc.encodeBuffer(samples)
      buffer.push(new Int8Array(mp3buf))
    }

    if (flush) {
      const end = mp3enc.flush()
      if (end.length > 0){
        buffer.push(new Int8Array(end))
      }
    }

    const blob = new Blob(buffer, { type: 'audio/mpeg' })
    return readAsArrayBuffer$(blob)
  }))
}
