import bufferToBase64 from './bufferToBase64'
import addWavHeader from './addWavHeader'

/**
 * pcmToWav
 * @example
 * pcmToWav(file).then((src) => $audio.src = src)
 */
export default function pcmToWav (file: Blob, sampleRate = 16000, sampleBits = 16, channelCount = 1) {
  const reader = new FileReader()

  // no need to `removeEventListener` if smart enough
  const promise = new Promise<string>((resolve, reject) => {
    reader.addEventListener('load', () => {
      const buffer = addWavHeader(reader.result as ArrayBuffer, sampleRate, sampleBits, channelCount)
      resolve(bufferToBase64(buffer))
    })

    reader.addEventListener('error', (err) => {
      reject(err)
    })
  })

  reader.readAsArrayBuffer(file)

  return promise
}
