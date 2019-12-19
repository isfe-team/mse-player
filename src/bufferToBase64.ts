/**
 * bufferToBase64
 */
export default function bufferToBase64 (buffer: ArrayBuffer) {
  const content = new Uint8Array(buffer).reduce((data, byte) => {
    return data + String.fromCharCode(byte)
  }, '')

  return `data:audio/wav;base64,${btoa(content)}`
}
