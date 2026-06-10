import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'

type PngImage = {
  data: Uint8Array
  height: number
  width: number
}

const paeth = (left: number, up: number, upLeft: number) => {
  const estimate = left + up - upLeft
  const leftDistance = Math.abs(estimate - left)
  const upDistance = Math.abs(estimate - up)
  const upLeftDistance = Math.abs(estimate - upLeft)

  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) {
    return left
  }

  return upDistance <= upLeftDistance ? up : upLeft
}

const readPng = (path: string): PngImage => {
  const bytes = readFileSync(path)
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10]

  expect([...bytes.subarray(0, 8)]).toEqual(pngSignature)

  let offset = 8
  let width = 0
  let height = 0
  const idatChunks: Buffer[] = []

  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset)
    offset += 4
    const type = bytes.subarray(offset, offset + 4).toString('ascii')
    offset += 4
    const chunk = bytes.subarray(offset, offset + length)
    offset += length + 4

    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0)
      height = chunk.readUInt32BE(4)

      expect(chunk[8]).toBe(8)
      expect(chunk[9]).toBe(6)
      expect(chunk[12]).toBe(0)
    }

    if (type === 'IDAT') {
      idatChunks.push(Buffer.from(chunk))
    }

    if (type === 'IEND') {
      break
    }
  }

  const raw = inflateSync(Buffer.concat(idatChunks))
  const channels = 4
  const stride = width * channels
  const data = new Uint8Array(height * stride)
  let rawOffset = 0

  for (let y = 0; y < height; y += 1) {
    const filter = raw[rawOffset]
    rawOffset += 1
    const row = raw.subarray(rawOffset, rawOffset + stride)
    rawOffset += stride

    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? data[y * stride + x - channels] : 0
      const up = y > 0 ? data[(y - 1) * stride + x] : 0
      const upLeft = y > 0 && x >= channels ? data[(y - 1) * stride + x - channels] : 0
      let value = row[x]

      if (filter === 1) {
        value = (value + left) & 255
      } else if (filter === 2) {
        value = (value + up) & 255
      } else if (filter === 3) {
        value = (value + Math.floor((left + up) / 2)) & 255
      } else if (filter === 4) {
        value = (value + paeth(left, up, upLeft)) & 255
      } else if (filter !== 0) {
        throw new Error(`Unsupported PNG filter: ${filter}`)
      }

      data[y * stride + x] = value
    }
  }

  return { data, height, width }
}

const pixelAt = (image: PngImage, x: number, y: number) => {
  const index = (y * image.width + x) * 4

  return {
    a: image.data[index + 3],
    b: image.data[index + 2],
    g: image.data[index + 1],
    r: image.data[index],
  }
}

describe('brand image assets', () => {
  it('keeps the suitcase background transparent without cutting out the orange body', () => {
    const image = readPng(join(process.cwd(), 'src/assets/lovv-suitcase-hi.png'))

    expect(pixelAt(image, 20, 20).a).toBe(0)

    const body = pixelAt(image, 512, 320)
    expect(body.a).toBeGreaterThan(240)
    expect(body.r).toBeGreaterThan(body.g)
    expect(body.r).toBeGreaterThan(body.b)

    expect(pixelAt(image, 512, 512).a).toBeGreaterThan(240)
  })
})
