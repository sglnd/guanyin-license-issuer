#!/usr/bin/env node
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { generateLicenseKeyPair, issueLicense } from './license.mjs'

function options(values) {
  const result = {}
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index]
    if (!key?.startsWith('--') || values[index + 1] === undefined) throw new Error(`参数无效：${key || ''}`)
    result[key.slice(2)] = values[index + 1]
  }
  return result
}

async function keygen(args) {
  const target = resolve(args.out || './keys')
  const pair = generateLicenseKeyPair()
  await mkdir(target, { recursive: true, mode: 0o700 })
  const privatePath = resolve(target, 'license-private.pem')
  const publicPath = resolve(target, 'license-public.pem')
  await Promise.all([writeFile(privatePath, pair.privateKey, { mode: 0o600 }), writeFile(publicPath, pair.publicKey, { mode: 0o644 })])
  await chmod(privatePath, 0o600)
  process.stderr.write(`私钥：${privatePath}\n公钥：${publicPath}\n请离线保管私钥，只把公钥配置到企业版。\n`)
}

async function issue(args) {
  if (!args.customer || !args.expires || !args.key) throw new Error('issue 需要 --customer、--expires 和 --key')
  const privateKey = await readFile(resolve(args.key), 'utf8')
  const expiresAt = /^\d{4}-\d{2}-\d{2}$/.test(args.expires) ? `${args.expires}T23:59:59Z` : args.expires
  const result = issueLicense({ customerName: args.customer, expiresAt, privateKey, ...(args.id ? { licenseId: args.id } : {}) })
  if (args.output) {
    const output = resolve(args.output)
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, `${result.token}\n`, { mode: 0o600 })
    process.stderr.write(`License 已写入：${output}\n客户：${result.customerName}\n到期：${result.expiresAt}\n`)
  } else process.stdout.write(`${result.token}\n`)
}

try {
  const [command, ...values] = process.argv.slice(2)
  const args = options(values)
  if (command === 'keygen') await keygen(args)
  else if (command === 'issue') await issue(args)
  else throw new Error('用法：node src/cli.mjs keygen --out <目录>，或 issue --customer <客户名称> --expires <YYYY-MM-DD> --key <私钥> [--output <文件>]')
} catch (error) {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
}
