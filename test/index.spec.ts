import { readPsd } from 'ag-psd'
import { Ajv } from 'ajv'
import { isNode } from 'browser-or-node'
import { describe, it } from 'vitest'
import { pdfToSchema } from '../src/index'

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
      const schema = pdfToSchema(psd)
      const ajv = new Ajv()
      ajv.compile(schema)
      console.warn(JSON.stringify(schema, null, 2))
    })
  })
})
