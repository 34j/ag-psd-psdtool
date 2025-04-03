/**
  @module
 */
import type { Layer, Psd } from 'ag-psd'
import Ajv from 'ajv'
import { countBy } from 'es-toolkit'

type Tag = 'fixed' | 'option' | 'filpx' | 'filpy' | 'filpxy'

interface PSDToolInfo {
  tags: Set<Tag>
  name: string
}

export function getPSDToolInfo(name: string | undefined): PSDToolInfo {
  name = name || ''
  const tags = new Set<Tag>()
  if (name.startsWith('!')) {
    tags.add('fixed')
    name = name.slice(1)
  }
  else if (name.startsWith('*')) {
    tags.add('option')
    name = name.slice(1)
  }
  while (true) {
    if (name.endsWith(':flipx')) {
      tags.add('filpx')
      name = name.slice(0, -':flipx'.length)
    }
    else if (name.endsWith(':flipy')) {
      tags.add('filpy')
      name = name.slice(0, -':flipy'.length)
    }
    else if (name.endsWith(':flipxy')) {
      tags.add('filpxy')
      name = name.slice(0, -':flipxy'.length)
    }
    else {
      break
    }
  }
  return {
    tags,
    name,
  }
}

function tagMatchesFlip(tags: Set<Tag>, flipx: bool, flipy: bool): bool {
  if (tags.has('filpxy') && flipx && flipy) {
    return true
  }
  if (tags.has('filpx') && flipx && !flipy) {
    return true
  }
  if (tags.has('filpy') && !flipx && flipy) {
    return true
  }
  if (!tags.has('filpx') && !tags.has('filpy') && !flipx && !flipy) {
    return true
  }
  return false
}

/**
 * Lorem ipsum.
 */
export function renderPsd(psd: Psd, data: any, schema: any = null, flipx: bool = false, flipy: bool = false): HTMLCanvasElement {
  schema = schema || getSchema(psd)
  const ajv = new Ajv({ useDefaults: true, removeAdditional: true })
  const validate = ajv.compile(schema)
  const valid = validate(data)
  if (!valid) {
    throw new Error('data does not match schema')
  }
  const queue: Layer[] = [psd]
  const ancestors: Layer[] = []
  const visibleLayers: Layer[] = []
  // layer.children are ordered from background to foreground
  while (queue.length) {
    const node = queue.shift()
    // should not happen
    if (!node) {
      break
    }

    const info = getPSDToolInfo(node.name)

    // relative path
    if (node !== psd) {
      while (ancestors.length && !ancestors.at(-1)?.children?.includes(node)) {
        ancestors.pop()
      }
      ancestors.push(node)
    }
    const currentPath = ancestors.map(layer => getPSDToolInfo(layer.name).name).join('/')

    const visible = data[currentPath] || info.tags.has('fixed') || !info.tags.has('visible') || node === psd
    if (!visible) {
      continue
    }

    // add children to queue
    if (node.children?.length) {
      const sameNameCount = countBy(node.children.filter(child => getPSDToolInfo(child.name).name), child => child.name || '')
      const duplicated = new Set(Object.entries(sameNameCount).filter(([_, count]) => count > 1).map(([name]) => name))
      queue.unshift(...node.children.map(child => ({ child, info: getPSDToolInfo(child.name) })).filter(s => !s.info.tags.has('option') || data[currentPath] === s.info.name).filter(s => !duplicated.has(s.info.name) || tagMatchesFlip(s.info.tags, flipx, flipy)).map(s => s.child))
    }
    else {
      visibleLayers.push(node)
    }
  }

  // merge all canvases
  const canvas = psd.canvas
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  visibleLayers.forEach((layer) => {
    ctx.drawImage(layer.canvas, layer.left, layer.top)
  })
  return canvas
}

export function getSchema(psd: Psd): any {
  const schema: any = {
    type: 'object',
    title: psd.name,
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

    const info = getPSDToolInfo(node.name)

    // relative path
    if (node !== psd) {
      while (ancestors.length && !ancestors.at(-1)?.children?.includes(node)) {
        ancestors.pop()
      }
      ancestors.push(node)
    }
    const currentPath = ancestors.map(layer => getPSDToolInfo(layer.name).name).join('/')

    // children is option
    // remove :flipx, :flipy, :flipxy
    const enumOptions = [...new Set(node.children?.map(child => getPSDToolInfo(child.name)).filter(info => info.tags.has('option')).map(info => info.name))]
    if (enumOptions.length) {
      schema.properties[currentPath] = {
        type: 'string',
        enum: enumOptions,
        // set first visible child as default
        default: node.children?.filter(child => child.hidden === false).map(child => getPSDToolInfo(child.name).name).at(0),
        nullable: !info.tags.has('fixed'),
      }
    }
    // top level
    else if (node === psd) {
      ;
    }
    // !: force visible
    else if (info.tags.has('fixed')) {
      ;
    }
    // *: option
    else if (info.tags.has('option')) {
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
