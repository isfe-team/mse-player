import bufferToBase64Wav from './bufferToBase64Wav'
import addWavHeader from './addWavHeader'
import readAsArrayBuffer$ from './readAsArrayBuffer$'

/**
 * pcmToWav
 * @example
 * pcmToWav(file).then((src) => $audio.src = src)
 */
export default function pcmToWav (file: Blob, sampleRate = 16000, sampleBits = 16, channelCount = 1) {
  return readAsArrayBuffer$(file).then((buffer) => {
    return bufferToBase64Wav(addWavHeader(buffer, sampleRate, sampleBits, channelCount))
  })
}
