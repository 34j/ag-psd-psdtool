import { readPsd } from 'ag-psd'
import { isNode } from 'browser-or-node'
import { describe, it } from 'vitest'

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
      console.warn(psd)
    })
  })
})
