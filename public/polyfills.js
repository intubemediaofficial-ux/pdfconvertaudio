// Polyfill for Uint8Array.prototype.toHex (required by pdfjs-dist v5.x)
if (typeof Uint8Array.prototype.toHex !== 'function') {
  Uint8Array.prototype.toHex = function() {
    return Array.from(this).map(function(b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  };
}

// Polyfill for Uint8Array.fromHex
if (typeof Uint8Array.fromHex !== 'function') {
  Uint8Array.fromHex = function(hex) {
    var bytes = new Uint8Array(hex.length / 2);
    for (var i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  };
}
