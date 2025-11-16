/**
 * MD5哈希工具
 * 使用浏览器的SubtleCrypto API计算MD5
 */

// 将字符串转换为ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// 将ArrayBuffer转换为十六进制字符串
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const hex: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    hex.push((byte >>> 4).toString(16));
    hex.push((byte & 0xf).toString(16));
  }
  return hex.join('');
}

// 简单的MD5实现（使用SubtleCrypto的SHA-256作为替代，因为浏览器不支持MD5）
// 为了兼容性，我们使用SHA-256并取前32个字符作为标识
export async function hashString(input: string): Promise<string> {
  try {
    const data = stringToArrayBuffer(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return arrayBufferToHex(hashBuffer).substring(0, 32); // 取前32个字符作为标识
  } catch (error) {
    console.error('计算哈希失败:', error);
    // 降级方案：使用简单的字符串哈希
    return simpleHash(input);
  }
}

// 简单的字符串哈希函数（降级方案）
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  // 转换为正数并转为16进制
  const hex = Math.abs(hash).toString(16);
  // 补齐到32位
  return hex.padStart(32, '0').substring(0, 32);
}

// 同步版本的哈希函数（用于编译期）
export function hashStringSync(input: string): string {
  return simpleHash(input);
}

