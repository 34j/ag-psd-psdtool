import { readPsd } from 'ag-psd'
import { isNode } from 'browser-or-node'
import { describe, it } from 'vitest'
import { renderPsd } from '../src/index'

describe('index', async () => {
  const request = await fetch('http://127.0.0.1:8080/ccchu.psd')
  const buffer = await request.arrayBuffer()
  if (isNode) {
    // eslint-disable-next-line ts/no-require-imports
    require('ag-psd/initialize-canvas')
  }
  const psd = readPsd(buffer)
  describe.for([{}, { right_eye: 'wink' }, { logo: null }])('data: %s', (data) => {
    describe.for([false, true])('flipy: %s', (flipy) => {
      describe.for([false, true])('flipx: %s', (flipx) => {
        it('should be able to write files', async () => {
          const canvas = renderPsd(psd, data, { flipx, flipy })
          if (isNode) {
            const { writeFile } = (await import('node:fs')).promises
            const Buffer = (await import('node:buffer')).Buffer
            await writeFile('test/assets/ccchuGen.png', Buffer.from(canvas.toDataURL().split(',')[1], 'base64'))
          }
        })
      })
    })
  })
})
