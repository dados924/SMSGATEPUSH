// Simple TOTP Implementation using Web Crypto API
// Supports Base32 secrets (standard for Authenticator apps)

const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32tohex(base32: string): string {
  let bits = '';
  let hex = '';

  const cleanBase32 = base32.replace(/=+$/, '').toUpperCase();

  for (let i = 0; i < cleanBase32.length; i++) {
    const val = base32chars.indexOf(cleanBase32.charAt(i));
    if (val === -1) throw new Error("Invalid Base32 character");
    bits += val.toString(2).padStart(5, '0');
  }

  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const chunk = bits.substr(i, 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
}

function hex2buf(hex: string): Uint8Array {
  const buf = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    buf[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return buf;
}

export const generateTOTP = async (secret: string, windowSeconds: number = 30): Promise<{ code: string; progress: number }> => {
  try {
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / windowSeconds);
    const progress = ((epoch % windowSeconds) / windowSeconds) * 100;

    const keyData = hex2buf(base32tohex(secret));
    
    // Create Counter Buffer (8 bytes)
    const counterBuf = new ArrayBuffer(8);
    const counterView = new DataView(counterBuf);
    counterView.setUint32(4, counter, false); // Big-endian

    // Import Key
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    // Sign
    const signature = await window.crypto.subtle.sign('HMAC', key, counterBuf);
    const signatureArray = new Uint8Array(signature);

    // Dynamic Truncation
    const offset = signatureArray[signatureArray.length - 1] & 0xf;
    const binary =
      ((signatureArray[offset] & 0x7f) << 24) |
      ((signatureArray[offset + 1] & 0xff) << 16) |
      ((signatureArray[offset + 2] & 0xff) << 8) |
      (signatureArray[offset + 3] & 0xff);

    const token = binary % 1000000;
    return { 
      code: token.toString().padStart(6, '0'),
      progress
    };
  } catch (e) {
    console.error("TOTP Generation Error:", e);
    return { code: 'ERROR', progress: 0 };
  }
};