# ag-psd-psdtool

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]
[![Code Coverage][codecov-img]][codecov-url]
[![Commitizen Friendly][commitizen-img]][commitizen-url]
[![Semantic Release][semantic-release-img]][semantic-release-url]

---

**📘Documentation**: [https://34j.github.io/ag-psd-psdtool/](https://34j.github.io/ag-psd-psdtool/)

**📦️NPM Package**: [https://www.npmjs.com/package/ag-psd-psdtool](https://www.npmjs.com/package/ag-psd-psdtool)

---

Export [PSDTool](https://oov.github.io/psdtool/)([kit](https://oov.github.io/aviutl_psdtoolkit/index.html))-compatible PSD files with options (visible states) changed using [ag-psd](https://github.com/Agamnentzar/ag-psd).

## Installation

```bash
npm install ag-psd-psdtool
```

## Usage

The code below works on both Node.js and browser environments thanks to the `fetch` API.

```ts
import { readPsd } from 'ag-psd'
import { getSchema, renderPsd } from 'ag-psd-psdtool'

// Fetch a PSD file
const url = 'https://raw.githubusercontent.com/34j/ag-psd-psdtool/refs/heads/main/test/assets/ccchu.psd'
const request = await fetch(url)
const psd = await request.arrayBuffer()

// 1. Get the schema
const schema = getSchema(psd)
console.log(schema)

// 2 . Change the visible states
const canvas = renderPsd(psd, { mouth: 'normal' }, { flipx: true })
```

Generated canvas:

![canvas](https://raw.githubusercontent.com/34j/ag-psd-psdtool/refs/heads/main/test/generated/ccchu-gen-0-true-false.png)

Schema:

```json
{
  "type": "object",
  "properties": {
    "logo": {
      "type": [
        "string",
        "boolean"
      ],
      "enum": [
        "logo",
        false
      ],
      "default": "logo"
    },
    "nose": {
      "type": "boolean",
      "default": false
    },
    "mouth": {
      "type": "string",
      "enum": [
        "normal",
        "dot"
      ],
      "default": "normal"
    },
    "right_eye": {
      "type": "string",
      "enum": [
        "normal",
        "wink",
        "horizontal"
      ],
      "default": "normal"
    }
  }
}
```

[build-img]:https://github.com/34j/ag-psd-psdtool/actions/workflows/release.yml/badge.svg
[build-url]:https://github.com/34j/ag-psd-psdtool/actions/workflows/release.yml
[downloads-img]:https://img.shields.io/npm/dt/ag-psd-psdtool
[downloads-url]:https://www.npmtrends.com/ag-psd-psdtool
[npm-img]:https://img.shields.io/npm/v/ag-psd-psdtool
[npm-url]:https://www.npmjs.com/package/ag-psd-psdtool
[issues-img]:https://img.shields.io/github/issues/34j/ag-psd-psdtool
[issues-url]:https://github.com/34j/ag-psd-psdtool/issues
[codecov-img]:https://codecov.io/gh/34j/ag-psd-psdtool/branch/main/graph/badge.svg
[codecov-url]:https://codecov.io/gh/34j/ag-psd-psdtool
[semantic-release-img]:https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]:https://github.com/semantic-release/semantic-release
[commitizen-img]:https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]:http://commitizen.github.io/cz-cli/
