if (typeof TextDecoder === 'undefined') {
  class TextDecoder {
    constructor(encoding = 'utf-8') {
      this.encoding = encoding.toLowerCase();
    }
 
    decode(dataView) {
      let data;
      if (dataView instanceof ArrayBuffer) {
        data = new Uint8Array(dataView);
      } else if (dataView instanceof Uint8Array) {
        data = dataView;
      } else {
        throw new Error('参数必须是 ArrayBuffer 或 Uint8Array');
      }
 
      if (this.encoding === 'utf-8') {
        return this._decodeUTF8(data);
      } else {
        throw new Error('当前只支持 UTF-8 编码');
      }
    }
 
    _decodeUTF8(data) {
      let str = '';
      let i = 0;
 
      while (i < data.length) {
        let byte1 = data[i];
        let char;
 
        // ASCII 字符
        if (byte1 < 0x80) {
          char = String.fromCharCode(byte1);
          i += 1;
        }
        // 2字节序列
        else if (byte1 < 0xE0) {
          const byte2 = data[i + 1];
          char = String.fromCharCode(((byte1 & 0x1F) << 6) | (byte2 & 0x3F));
          i += 2;
        }
        // 3字节序列
        else if (byte1 < 0xF0) {
          const byte2 = data[i + 1];
          const byte3 = data[i + 2];
          char = String.fromCharCode(
            ((byte1 & 0x0F) << 12) |
            ((byte2 & 0x3F) << 6) |
            (byte3 & 0x3F)
          );
          i += 3;
        }
        // 4字节序列
        else {
          const byte2 = data[i + 1];
          const byte3 = data[i + 2];
          const byte4 = data[i + 3];
          let codepoint = ((byte1 & 0x07) << 18) |
            ((byte2 & 0x3F) << 12) |
            ((byte3 & 0x3F) << 6) |
            (byte4 & 0x3F);
 
          // UTF-16 surrogate pair
          codepoint -= 0x10000;
          const highSurrogate = (codepoint >> 10) + 0xD800;
          const lowSurrogate = (codepoint & 0x3FF) + 0xDC00;
          char = String.fromCharCode(highSurrogate, lowSurrogate);
          i += 4;
        }
 
        str += char;
      }
 
      return str;
    }
  }
 
  // 全局注入 TextDecoder
  globalThis.TextDecoder = TextDecoder;
}