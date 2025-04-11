/**
  @module
 */
import type { Layer, Psd } from 'ag-psd'
import Ajv from 'ajv'
import { countBy } from 'es-toolkit'

type Tag = 'fixed' | 'option' | 'filpx' | 'filpy' | 'filpxy'

/**
 * The PSDTool extension info which can be generated from the layer name.
 */
interface PSDToolInfo {
  /**
   * The tags of the layer.
   * !: fixed
   * : option
   * :flipx: flipx
   * :flipy: flipy
   * :flipxy: flipxy
   * @example
   * !*layer:flipx:flipy => fixed, filpx, filpy
   */
  tags: Set<Tag>
  /**
   * The name of the layer without the tags.
   * @example
   * !*layer:flipx:flipy => *layer
   */
  name: string
}

/**
 * Get the PSDToolInfo from the name.
 * @param name The name of the layer.
 * @returns The PSDToolInfo.
 * @throws {Error} If the name is not a string.
 */
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

/**
 * Whether the tags match the flipx and flipy options.
 * @param tags The tags to check.
 * @param flipx Whether to flip the image horizontally.
 * @param flipy Whether to flip the image vertically.
 * @returns Whether the tags match the flipx and flipy options.
 */
function tagMatchesFlip(tags: Set<Tag>, flipx: boolean, flipy: boolean): boolean {
  if (tags.has('filpxy') && flipx && flipy) {
    return true
  }
  if (tags.has('filpx') && flipx && !flipy) {
    return true
  }
  if (tags.has('filpy') && !flipx && flipy) {
    return true
  }
  if (!tags.has('filpxy') && !tags.has('filpx') && !tags.has('filpy') && !flipx && !flipy) {
    return true
  }
  return false
}

/**
 * The options for rendering a PSD file.
 */
export interface RenderOptions {
  /**
   * Whether to flip the image horizontally.
   */
  flipx?: boolean
  /**
   * Whether to flip the image vertically.
   */
  flipy?: boolean
  /**
   * The schema to use for validation.
   */
  schema?: any
  /**
   * The canvas to use for rendering.
   * If not provided, psd.canvas will be used.
   */
  canvas?: any | null
}

/**
 * Renders a PSD file to a canvas.
 * @param psd The PSD file to render.
 * @param data The data to use for rendering.
 * @param options The options for rendering.
 * @returns The rendered canvas.
 * @throws {Error} If the data does not match the schema.
 */
export function renderPsd(psd: Psd, data: Record<string, any>, options?: RenderOptions): any {
  const flipx = options?.flipx || false
  const flipy = options?.flipy || false
  const schema = options?.schema || getSchema(psd)
  const canvas = options?.canvas || psd.canvas
  const ajv = new Ajv({ useDefaults: true, removeAdditional: true, allowUnionTypes: true })
  const validate = ajv.compile(schema)
  const valid = validate(data)
  if (!valid) {
    throw new Error(`
      data does not match schema:
      errors: ${JSON.stringify(validate.errors, null, 2)}
      data: ${JSON.stringify(data, null, 2)}
      schema: ${JSON.stringify(schema, null, 2)}
    `)
  }
  const queue: Layer[] = [psd]
  const ancestors: Layer[] = []
  const visibleLayers: Layer[] = []
  // layer.children are ordered from background to foreground
  while (queue.length) {
    const node = queue.shift()
    if (!node) {
      /* v8 ignore next 2 */
      throw new Error('AssertionError: node is null')
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

    // if not false, visible
    // if fixed, visible
    // if option, that means node is queued, thus visible
    // if top level, visible
    const visible = data[currentPath] !== false || info.tags.has('fixed') || info.tags.has('option') || node === psd

    // do nothing if not visible
    if (!visible) {
      continue
    }

    // add children to queue
    if (node.children?.length) {
      const sameNameCount = countBy(node.children, child => getPSDToolInfo(child.name).name)
      // children has multiple variants (:flipx, :flipy, :flipxy, etc.)
      const duplicated = new Set(Object.entries(sameNameCount).filter(([_, count]) => count > 1).map(([name]) => name))
      queue.unshift(...node.children
        .map(child => ({ child, info: getPSDToolInfo(child.name) }))
        .filter(s => !s.info.tags.has('option') || data[currentPath] === s.info.name)
        .filter(s => !duplicated.has(s.info.name) || tagMatchesFlip(s.info.tags, flipx, flipy))
        .map(s => s.child),
      )
    }
    // add to visible layers
    else {
      visibleLayers.push(node)
    }
  }

  // merge all canvases
  const ctx = canvas.getContext('2d')
  // clear canvas
  ctx.canvas.width = psd.width
  ctx.canvas.height = psd.height
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  // flip canvas
  ctx.scale(flipx ? -1 : 1, flipy ? -1 : 1)
  ctx.translate(flipx ? -canvas.width : 0, flipy ? -canvas.height : 0)
  // draw all visible layers
  visibleLayers.filter(layer => layer.canvas).forEach((layer) => {
    // ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(layer.canvas, layer.left, layer.top)
  })
  return canvas
}

/**
 * Get the schema for the PSD file.
 * @param psd The PSD file to get the schema for.
 * @returns The schema for the PSD file.
 */
export function getSchema(psd: Psd): Record<string, any> {
  const schema: any = {
    type: 'object',
    title: psd.name,
    properties: {},
  }
  const queue: Layer[] = [psd]
  const ancestors: Layer[] = []
  while (queue.length) {
    const node = queue.pop()
    if (!node) {
      /* v8 ignore next 2 */
      throw new Error('AssertionError: node is null')
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
    const enumOptions: (string | boolean)[] = [...new Set(node.children?.map(child => getPSDToolInfo(child.name)).filter(info => info.tags.has('option')).map(info => info.name))]
    if (enumOptions.length > 0) {
      if (!info.tags.has('fixed')) {
        enumOptions.push(false)
      }
      schema.properties[currentPath] = {
        type: info.tags.has('fixed') ? 'string' : ['string', 'boolean'],
        enum: enumOptions,
        // set first visible child as default
        default: node.children?.filter(child => child.hidden === false).map(child => getPSDToolInfo(child.name).name).at(0),
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
    // boolean option
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
