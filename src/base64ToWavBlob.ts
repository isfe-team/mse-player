import base64ToBlob from './base64ToBlob'

export default function base64ToWavBlob(str: string) {
  return base64ToBlob(str, { type: 'wav' })
}
