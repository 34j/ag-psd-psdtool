/**
  @module
 */
import type { Layer, Psd } from 'ag-psd'
/**
 * Lorem ipsum.
 */
export function renderPsd(psd: Psd): HTMLCanvasElement {
  const canvas = psd.children[0].canvas
  return canvas
}

export function pdfToSchema(psd: Psd): Record<string, string> {
  const schema = {
    type: 'object',
    properties: {},
  }
  const queue: Layer[] = [psd]
  const path: Layer[] = []
  while (queue.length) {
    const node = queue.pop()
    if (!node) {
      break
    }
    if (node !== psd) {
      while (path.length && !path[path.length - 1]?.children?.includes(node)) {
        path.pop()
      }
      path.push(node)
    }
    const currentPath = path.map(layer => layer.name).join('/')
    node.children?.forEach((child) => {
      queue.push(child)
    })
    const enumOptions = node.children?.map(child => child.name).filter(name => name?.startsWith('*'))
    if (enumOptions?.length) {
      schema.properties[currentPath] = {
        type: 'string',
        enum: enumOptions,
        nullable: !node.name?.startsWith('!'),
      }
    }
    // force visible
    else if (node.name?.startsWith('!')) {
      ;
    }
    // option
    else if (node.name?.startsWith('*')) {
      ;
    }
    else {
      schema.properties[currentPath] = {
        type: 'boolean',
      }
    }
  }
  return schema
}
