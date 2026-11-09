import { describe, it, expect } from 'vitest';

import {
  detectMimeType,
  MAX_FILE_SIZE_BYTES,
  validateFile,
} from '../../../../src/business/domain/file';
import {
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  ValidationError,
} from '../../../../src/business/domain/errors';

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // "%PDF-1.7"
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const TEXT = new TextEncoder().encode('this is not an invoice');

//Detect MIME with magic bytes
describe('detectMimeType', () => {
  it.each([
    ['application/pdf', PDF],
    ['image/png', PNG],
    ['image/jpeg', JPG],
  ])('detect %s by its magic bytes', (expected, content) => {
    expect(detectMimeType(content)).toBe(expected);
  });

  it('return null for unknown file types', () => {
    expect(detectMimeType(TEXT)).toBeNull();
  });

  it('return null when the content is shorter than the siganture', () => {
    expect(detectMimeType(new Uint8Array([0x25, 0x50]))).toBeNull();
  });
});

//Validate file tests

describe('validateFile', () => {
  it('returns the MIME type for valid files', () => {
    const file = { content: PDF, originalName: 'invoice.pdf', sizeBytes: PDF.length };
    expect(validateFile(file)).toBe('application/pdf');
  });

  it('reject an empty file with ValidationError', () => {
    const file = { content: new Uint8Array(), originalName: 'empty.pdf', sizeBytes: 0 };
    expect(() => validateFile(file)).toThrow(ValidationError);
  });

  it('reject a file that exceeds the maximum size with PayloadTooLargeError', () => {
    const file = { content: PDF, originalName: 'large.pdf', sizeBytes: MAX_FILE_SIZE_BYTES + 1 };
    expect(() => validateFile(file)).toThrow(PayloadTooLargeError);
  });

  it('reject a file with an unsupported MIME type with UnsupportedMediaTypeError', () => {
    const file = { content: TEXT, originalName: 'text.txt', sizeBytes: TEXT.length };
    expect(() => validateFile(file)).toThrow(UnsupportedMediaTypeError);
  });
});
