import { readPsd } from 'ag-psd'
import { isNode } from 'browser-or-node'
import { describe, expect, it } from 'vitest'
import { renderPsd } from '../src/index'

describe('index', async () => {
  const request = await fetch('http://127.0.0.1:8080/ccchu.psd')
  const buffer = await request.arrayBuffer()
  if (isNode) {
    // eslint-disable-next-line ts/no-require-imports
    require('ag-psd/initialize-canvas')
  }
  const psd = readPsd(buffer)
  describe.for([false, true])('flipy: %s', (flipy) => {
    describe.for([false, true])('flipx: %s', (flipx) => {
      describe.for([{}, { right_eye: 'wink' }, { logo: false }, { logo: 'hello' }].entries().toArray())('data: %s', ([i, data]) => {
        it('should be able to write files', async () => {
          if (i === 3) {
            expect(() => renderPsd(psd, data, { flipx, flipy })).toThrowError()
            return
          }
          const canvas = renderPsd(psd, data, { flipx, flipy })
          if (isNode) {
            const { writeFile, mkdir } = (await import('node:fs')).promises
            const Buffer = (await import('node:buffer')).Buffer
            await mkdir('test/generated', { recursive: true })
            await writeFile(`test/generated/ccchu-gen-${i}-${flipx}-${flipy}.png`, Buffer.from(canvas.toDataURL().split(',')[1], 'base64'))
          }
        })
      })
    })
  })
})
