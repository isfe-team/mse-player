/**
 * bufferToBase64Wav
 */

import bufferToBase64 from './bufferToBase64'

export default function bufferToBase64Wav (buffer: ArrayBuffer) {
  return `data:audio/wav;base64,${bufferToBase64(buffer)}`
}
