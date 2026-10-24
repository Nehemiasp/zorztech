import { test } from "node:test";
import assert from "node:assert/strict";
import { detectImageType, isLocalUploadName } from "./storage";

const bytes = (...n: number[]) => new Uint8Array([...n, ...new Array(16).fill(0)]);
const text = (s: string) => new TextEncoder().encode(s);

test("reconoce JPG, PNG, WebP y AVIF por su contenido", () => {
  assert.equal(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg");
  assert.equal(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), "image/png");
  assert.equal(detectImageType(new Uint8Array([...text("RIFF"), 0, 0, 0, 0, ...text("WEBP")])), "image/webp");
  assert.equal(detectImageType(new Uint8Array([0, 0, 0, 24, ...text("ftypavif")])), "image/avif");
});

test("rechaza lo que no es una imagen admitida, aunque se llame .jpg", () => {
  assert.equal(detectImageType(text("<script>alert(1)</script>")), null);
  assert.equal(detectImageType(text("<svg xmlns='http://www.w3.org/2000/svg'></svg>")), null);
  assert.equal(detectImageType(text("GIF89a")), null);
  assert.equal(detectImageType(new Uint8Array([])), null);
});

test("los nombres de archivos locales no admiten rutas", () => {
  assert.ok(isLocalUploadName("0123456789abcdef01234567.webp"));
  for (const bad of ["../secreto.png", "0123456789abcdef01234567.svg", "abc.png", "0123456789abcdef01234567.png/../x"]) {
    assert.ok(!isLocalUploadName(bad), bad);
  }
});
