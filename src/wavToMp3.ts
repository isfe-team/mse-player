/**
 * use [lamejs](https://github.com/zhuker/lamejs#real-example) to encode mp3
 * @todo
 *  - [ ] to `ts`
 */

import lamejs from 'lamejs'

export default function wavToMp3 (buffers: Array<ArrayBuffer>): Promise<Array<ArrayBuffer>> {
  return Promise.all<ArrayBuffer>(buffers.map((buf) => new Promise((resolve, reject) => {
    const wav = lamejs.WavHeader.readHeader(new DataView(buf))
    const samples = new Int16Array(buf, wav.dataOffset, wav.dataLen / 2)
    const buffer = [ ]
    const mp3enc = new lamejs.Mp3Encoder(wav.channels, wav.sampleRate, 128)

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

    const flush = mp3enc.flush()
    if (flush.length > 0){
      buffer.push(new Int8Array(flush))
    }

    const blob = new Blob(buffer, { type: 'audio/mpeg' })
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      resolve(reader.result as ArrayBuffer)
    })
    reader.addEventListener('error', (error) => {
      reject(error)
    })

    reader.readAsArrayBuffer(blob)
  })))
}
