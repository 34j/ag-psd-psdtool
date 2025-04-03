/**
  @module
 */
import type { Layer, Psd } from 'ag-psd'
import Ajv from 'ajv'

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
  const ajv = new Ajv({ useDefaults: true, removeAdditional: true })
  const validate = ajv.compile(schema)
  const valid = validate(data)
  if (!valid) {
    throw new Error('data does not match schema')
  }
  const queue: Layer[] = [psd]
  const ancestors: Layer[] = []
  const canvasList: HTMLLinkElement[] = []
  while (queue.length) {
    const node = queue.pop()
    // should not happen
    if (!node) {
      break
    }

    // relative path
    if (node !== psd) {
      while (ancestors.length && !ancestors.at(-1)?.children?.includes(node)) {
        ancestors.pop()
      }
      ancestors.push(node)
    }
    const currentPath = ancestors.map(layer => extractName(layer.name || '')).join('/')

    // add children to queue
    node.children?.forEach((child) => {
      queue.push(child)
    })

    const visible = data[currentPath] || node.name?.startsWith('!') || node.name?.startsWith('*')
    if (!visible) {
      continue
    }
    if (node.children?.length) {
      if (schema.properties[currentPath]?.enum) {
        const visibleChild = node.children.find(child => extractName(child.name || '') === data[currentPath])
        if (visibleChild) {
          queue.push(visibleChild)
          ancestors.push(visibleChild)
        }
      }
      for (const child of node.children) {
        if (child.name?.startsWith('*')) {
          continue
        }
        queue.push(child)
      }
    }
    else {
      canvasList.push(node.canvas)
    }
  }

  // merge all canvases
  const canvas = psd.canvas
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const c of canvasList) {
    ctx.drawImage(c, 0, 0)
  }
  return canvas
}

export function pdfToSchema(psd: Psd): any {
  const schema: any = {
    type: 'object',
    properties: {},
  }
  const queue: Layer[] = [psd]
  const ancestors: Layer[] = []
  while (queue.length) {
    const node = queue.pop()
    // should not happen
    if (!node) {
      break
    }

    // relative path
    if (node !== psd) {
      while (ancestors.length && !ancestors.at(-1)?.children?.includes(node)) {
        ancestors.pop()
      }
      ancestors.push(node)
    }
    const currentPath = ancestors.map(layer => extractName(layer.name || '')).join('/')

    // children is option
    const enumOptions = node.children?.map(child => child.name).filter(name => name?.startsWith('*')).map(name => extractName(name || ''))
    if (enumOptions?.length) {
      schema.properties[currentPath] = {
        type: 'string',
        enum: enumOptions,
        default: node.children?.filter(child => child.hidden === false).map(child => extractName(child.name || '')).at(0),
        nullable: !node.name?.startsWith('!'),
      }
    }
    // top level
    else if (node === psd) {
      ;
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
        default: node.hidden === false,
      }
    }

    // add children to queue
    node.children?.forEach((child) => {
      queue.push(child)
    })
  }
  return schema
}
