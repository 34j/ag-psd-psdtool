/**
  @module
 */
import type { Psd } from 'ag-psd'
/**
 * Lorem ipsum.
 */
export function renderPsd(psd: Psd): HTMLCanvasElement {
  const canvas = psd.children[0].canvas
  return canvas
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function pdfToTypes(psd: Psd): Record<string, string> {
  return {}
}
