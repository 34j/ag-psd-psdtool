/**
  @module
 */
import type { Layer, Psd } from 'ag-psd'

function extractName(name: string): string {
  if (name.startsWith('!')) {
    return name.slice(1)
  }
  else if (name.startsWith('*')) {
    return name.slice(1)
  }
  return name
}

/**
 * Lorem ipsum.
 */
export function renderPsd(psd: Psd, data: any, schema: any = null): HTMLCanvasElement {
  schema = schema || pdfToSchema(psd)
  const queue: Layer[] = [psd]
  const path: Layer[] = []
  const canvas: HTMLLinkElement[] = []
  while (queue.length) {
    const node = queue.pop()
    // should not happen
    if (!node) {
      break
    }

    // relative path
    if (node !== psd) {
      while (path.length && !path.at(-1)?.children?.includes(node)) {
        path.pop()
      }
      path.push(node)
    }
    const currentPath = path.map((layer) => { extractName(layer.name || '') }).join('/')
  }
}

export function pdfToSchema(psd: Psd): any {
  const schema: any = {
    type: 'object',
    properties: {},
  }
  const queue: Layer[] = [psd]
  const path: Layer[] = []
  while (queue.length) {
    const node = queue.pop()
    // should not happen
    if (!node) {
      break
    }

    // relative path
    if (node !== psd) {
      while (path.length && !path.at(-1)?.children?.includes(node)) {
        path.pop()
      }
      path.push(node)
    }
    const currentPath = path.map(layer => extractName(layer.name || '')).join('/')

    // add children to queue
    node.children?.forEach((child) => {
      queue.push(child)
    })

    // children is option
    const enumOptions = node.children?.map(child => child.name).filter(name => name?.startsWith('*')).map(name => extractName(name || ''))
    if (enumOptions?.length) {
      schema.properties[currentPath] = {
        type: 'string',
        enum: enumOptions,
        nullable: !node.name?.startsWith('!'),
      }
    }

    // !: force visible
    else if (node.name?.startsWith('!')) {
      ;
    }
    // *: option
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
