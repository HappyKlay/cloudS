/**
 * Derives a key using HKDF with HMAC-SHA256 via the Web Crypto API.
 * @param {ArrayBuffer|string} ikm - Initial keying material.
 * @param {ArrayBuffer|string} salt - Salt value.
 * @param {ArrayBuffer|string} info - Context/application-specific info.
 * @param {number} length - Desired length of the derived key in bytes.
 * @returns {Promise<Uint8Array>} The derived key material.
 */
export async function hkdf(ikm, salt, info, length) {
    const encoder = new TextEncoder();

    const ikmBuffer = typeof ikm === 'string' ? encoder.encode(ikm) : ikm;
    const saltBuffer = typeof salt === 'string' ? encoder.encode(salt) : salt;
    const infoBuffer = typeof info === 'string' ? encoder.encode(info) : info;

    const extractKey = await window.crypto.subtle.importKey(
        'raw',
        saltBuffer,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const prk = await window.crypto.subtle.sign('HMAC', extractKey, ikmBuffer);

    const prkKey = await window.crypto.subtle.importKey(
        'raw',
        prk,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    let t = new Uint8Array(0);
    let okm = new Uint8Array(0);
    let i = 0;

    while (okm.length < length) {
        i++;
        const data = new Uint8Array(t.length + infoBuffer.length + 1);
        data.set(t, 0);
        data.set(infoBuffer, t.length);
        data.set([i], t.length + infoBuffer.length);

        const ti = await window.crypto.subtle.sign('HMAC', prkKey, data);
        t = new Uint8Array(ti);

        const newOkm = new Uint8Array(okm.length + t.length);
        newOkm.set(okm, 0);
        newOkm.set(t, okm.length);
        okm = newOkm;
    }

    return okm.slice(0, length);
}