import { readPsd } from 'ag-psd'
import { isNode } from 'browser-or-node'
import { describe, it } from 'vitest'
import { renderPsd } from '../src/index'

describe('index', () => {
  describe('psdToTypes', () => {
    it('should return a string containing the message', async () => {
      const request = await fetch('http://127.0.0.1:8080/test.psd')
      const buffer = await request.arrayBuffer()
      if (isNode) {
        // eslint-disable-next-line ts/no-require-imports
        require('ag-psd/initialize-canvas')
      }
      const psd = readPsd(buffer)
      const canvas = renderPsd(psd, {})
      if (isNode) {
        const { writeFile } = (await import('node:fs')).promises
        const Buffer = (await import('node:buffer')).Buffer
        await writeFile('test.png', Buffer.from(canvas.toDataURL().split(',')[1], 'base64'))
      }
    })
  })
})
