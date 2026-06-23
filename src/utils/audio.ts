/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Downsamples a Float32Array from one sample rate to another using averaging.
 * Required because iOS Safari doesn't support custom AudioContext sample rates.
 */
export function downsampleBuffer(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.floor((i + 1) * ratio);
    let sum = 0;
    for (let j = start; j < end && j < input.length; j++) sum += input[j];
    output[i] = sum / (end - start);
  }
  return output;
}

/**
 * Converts Float32Array audio samples into 16-bit Signed Integer PCM (little-endian) ArrayBuffer.
 */
export function floatTo16BitPCM(floatSamples: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(floatSamples.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < floatSamples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, floatSamples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

/**
 * Converts an ArrayBuffer to a Base64-encoded string.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string of raw 16-bit Signed Integer PCM into Float32Array samples.
 */
export function base64ToFloat32Array(base64: string): Float32Array {
  const binary = atob(base64);
  const len = binary.length;
  const buffer = new ArrayBuffer(len);
  const uint8View = new Uint8Array(buffer);
  for (let i = 0; i < len; i++) {
    uint8View[i] = binary.charCodeAt(i);
  }
  const int16View = new Int16Array(buffer);
  const float32View = new Float32Array(int16View.length);
  for (let i = 0; i < int16View.length; i++) {
    float32View[i] = int16View[i] / 32768.0;
  }
  return float32View;
}
