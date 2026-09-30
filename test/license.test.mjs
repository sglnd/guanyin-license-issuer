import assert from 'node:assert/strict'
import { createPublicKey, verify } from 'node:crypto'
import test from 'node:test'
import { generateLicenseKeyPair, issueLicense } from '../src/license.mjs'

test('issues a verifiable Ed25519 enterprise license', () => {
  const keys = generateLicenseKeyPair()
  const result = issueLicense({ customerName: ' 测试客户 ', expiresAt: '2027-12-31T23:59:59Z', privateKey: keys.privateKey, licenseId: 'lic_test', now: new Date('2026-01-01T00:00:00Z') })
  const [header, payload, signature] = result.token.split('.')
  assert.equal(verify(null, Buffer.from(`${header}.${payload}`), createPublicKey(keys.publicKey), Buffer.from(signature, 'base64url')), true)
  assert.deepEqual(JSON.parse(Buffer.from(payload, 'base64url')), {
    iss: 'guanyin-license-issuer', aud: 'guanyin-enterprise', edition: 'enterprise', license_id: 'lic_test',
    customer_name: '测试客户', iat: 1767225600, nbf: 1767225600, exp: 1830297599,
  })
})
