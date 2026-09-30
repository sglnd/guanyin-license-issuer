import { generateKeyPairSync, randomUUID, sign } from 'node:crypto'

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')

export function generateLicenseKeyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519')
  return {
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }),
  }
}

export function issueLicense({ customerName, expiresAt, privateKey, licenseId = `lic_${randomUUID()}`, now = new Date() }) {
  const normalizedName = String(customerName || '').trim().normalize('NFC')
  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
  if (!normalizedName) throw new Error('客户名称不能为空')
  if (!privateKey) throw new Error('缺少签发私钥')
  if (!Number.isFinite(expiry.getTime())) throw new Error('到期时间无效')
  const issuedAt = Math.floor(now.getTime() / 1000)
  const expires = Math.floor(expiry.getTime() / 1000)
  if (expires <= issuedAt) throw new Error('到期时间必须晚于签发时间')
  const header = encode({ alg: 'EdDSA', typ: 'JWT' })
  const payload = encode({
    iss: 'guanyin-license-issuer', aud: 'guanyin-enterprise', edition: 'enterprise',
    license_id: licenseId, customer_name: normalizedName, iat: issuedAt, nbf: issuedAt, exp: expires,
  })
  const signature = sign(null, Buffer.from(`${header}.${payload}`), privateKey).toString('base64url')
  return { token: `${header}.${payload}.${signature}`, licenseId, customerName: normalizedName, expiresAt: expiry.toISOString() }
}
