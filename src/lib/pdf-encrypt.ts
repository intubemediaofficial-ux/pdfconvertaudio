function md5(data: Uint8Array): Uint8Array {
  const k = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
    0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
    0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
    0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
    0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
    0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const origLen = data.length;
  const bitLen = origLen * 8;
  const newLen = origLen + 1 + ((55 - origLen % 64 + 64) % 64);
  const msg = new Uint8Array(newLen + 8);
  msg.set(data);
  msg[origLen] = 0x80;
  for (let i = 0; i < 8; i++) msg[newLen + i] = (bitLen >>> (i * 8)) & 0xff;

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let offset = 0; offset < msg.length; offset += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = msg[offset + j * 4] | (msg[offset + j * 4 + 1] << 8) |
              (msg[offset + j * 4 + 2] << 16) | (msg[offset + j * 4 + 3] << 24);
    }

    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + k[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      B = (B + ((F << s[i]) | (F >>> (32 - s[i])))) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }

  const result = new Uint8Array(16);
  [a0, b0, c0, d0].forEach((v, i) => {
    result[i * 4] = v & 0xff;
    result[i * 4 + 1] = (v >> 8) & 0xff;
    result[i * 4 + 2] = (v >> 16) & 0xff;
    result[i * 4 + 3] = (v >> 24) & 0xff;
  });
  return result;
}

function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
  const S = new Uint8Array(256);
  for (let i = 0; i < 256; i++) S[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key[i % key.length]) & 0xff;
    [S[i], S[j]] = [S[j], S[i]];
  }
  const out = new Uint8Array(data.length);
  let i2 = 0; j = 0;
  for (let n = 0; n < data.length; n++) {
    i2 = (i2 + 1) & 0xff;
    j = (j + S[i2]) & 0xff;
    [S[i2], S[j]] = [S[j], S[i2]];
    out[n] = data[n] ^ S[(S[i2] + S[j]) & 0xff];
  }
  return out;
}

const PADDING = new Uint8Array([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41,
  0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
  0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
  0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

export async function encryptPdf(pdfBytes: Uint8Array, userPassword: string): Promise<Uint8Array> {
  const text = new TextDecoder().decode(pdfBytes);

  const idMatch = text.match(/\/ID\s*\[\s*<([0-9a-fA-F]+)>/);
  let fileId: Uint8Array;
  if (idMatch) {
    const hex = idMatch[1];
    fileId = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      fileId[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
  } else {
    fileId = crypto.getRandomValues(new Uint8Array(16));
  }

  const paddedPassword = new Uint8Array(32);
  const pwBytes = new TextEncoder().encode(userPassword);
  paddedPassword.set(pwBytes.slice(0, 32));
  if (pwBytes.length < 32) {
    paddedPassword.set(PADDING.slice(0, 32 - pwBytes.length), pwBytes.length);
  }

  const permissions = -3904;
  const permBytes = new Uint8Array(4);
  new DataView(permBytes.buffer).setInt32(0, permissions, true);

  const hashInput = new Uint8Array(paddedPassword.length + 32 + fileId.length + 4);
  let offset = 0;
  hashInput.set(paddedPassword, offset); offset += paddedPassword.length;
  hashInput.set(PADDING, offset); offset += 32;
  hashInput.set(fileId, offset); offset += fileId.length;
  hashInput.set(permBytes, offset);

  let encKey = md5(hashInput);
  for (let i = 0; i < 50; i++) {
    encKey = md5(encKey);
  }

  const oValue = rc4(encKey, paddedPassword);
  const uValue = rc4(encKey, PADDING);

  const fileIdHex = Array.from(fileId).map(b => b.toString(16).padStart(2, '0')).join('');
  const oHex = Array.from(oValue).map(b => b.toString(16).padStart(2, '0')).join('');
  const uHex = Array.from(uValue).map(b => b.toString(16).padStart(2, '0')).join('');

  const encryptDict = [
    `<<`,
    `/Type /Catalog`,
    `>>`,
  ].join('\n');

  void encryptDict;

  const encryptEntry = [
    `/Filter /Standard`,
    `/V 1`,
    `/R 2`,
    `/O <${oHex}>`,
    `/U <${uHex}>`,
    `/P ${permissions}`,
    `/Length 40`,
  ].join(' ');

  const textStr = new TextDecoder().decode(pdfBytes);
  const xrefPos = textStr.lastIndexOf('startxref');
  if (xrefPos === -1) throw new Error('Invalid PDF: no startxref');

  const beforeXref = pdfBytes.slice(0, xrefPos);
  const afterXref = pdfBytes.slice(xrefPos);

  const objNum = (textStr.match(/(\d+)\s+\d+\s+obj/g) || []).length + 1;

  const encryptObj = `${objNum} 0 obj\n<< ${encryptEntry} >>\nendobj\n`;
  const encryptObjBytes = new TextEncoder().encode(encryptObj);

  const newIdEntry = `/ID [<${fileIdHex}> <${fileIdHex}>]`;

  const afterXrefStr = new TextDecoder().decode(afterXref);
  let modifiedTrailer: string;

  if (afterXrefStr.includes('trailer')) {
    modifiedTrailer = afterXrefStr.replace(
      new RegExp('trailer\\s*<<([^>]*)>>', 's'),
      (match, inner) => {
        const cleanInner = inner.replace(/\/ID\s*\[[^\]]*\]/g, '');
        return `trailer\n<<${cleanInner} /Encrypt ${objNum} 0 R ${newIdEntry}>>`;
      }
    );
  } else {
    modifiedTrailer = afterXrefStr;
  }

  const modifiedTrailerBytes = new TextEncoder().encode(modifiedTrailer);

  const result = new Uint8Array(beforeXref.length + encryptObjBytes.length + modifiedTrailerBytes.length);
  result.set(beforeXref, 0);
  result.set(encryptObjBytes, beforeXref.length);
  result.set(modifiedTrailerBytes, beforeXref.length + encryptObjBytes.length);

  return result;
}
