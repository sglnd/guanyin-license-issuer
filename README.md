# Guanyin License Issuer

观因企业授权的内部签发项目。此项目仅供供应方受控环境使用，不属于客户交付物，也不应被企业版镜像或部署流水线依赖。

## 使用

要求 Node.js 22 或更高版本，无第三方依赖。

```bash
npm run keygen -- --out ./keys
npm run issue -- \
  --customer "某某科技有限公司" \
  --expires 2027-12-31 \
  --key ./keys/license-private.pem \
  --output ./customer-license.token
```

`keygen` 生成 Ed25519 密钥对。私钥只保留在受控签发环境；将公钥内容配置为企业版控制面的 `GUANYIN_LICENSE_PUBLIC_KEY`。`issue` 默认生成唯一 License ID，并在标准错误输出中显示客户和到期时间，Token 输出到指定文件。

到期日期按 UTC 当日 `23:59:59` 处理。客户名称会去除首尾空格并进行 Unicode NFC 规范化，企业版录入时必须使用同一完整名称。

## 安全边界

- 签发私钥不得提交到 Git，不得进入 `guanyin-platform` 或 `guanyin-enterprise`。
- 私钥不得写入容器镜像、测试夹具、示例配置、CI 日志或客户部署 Secret。
- 生产签发应使用受控密钥服务、HSM，或由严格权限保护的离线介质。
- 项目输出只包含签名后的许可证 Token；企业交付系统只内置对应的验签公钥。
- 客户许可证、申请文件和企业信息视为敏感运营数据，不应提交到源码仓库。

## 目录

```text
docs/             签发模型、安全与运维文档
src/              离线密钥生成与签发命令行
test/             运行时生成临时测试密钥的自动化测试
```

测试密钥必须明确标记为测试用途，并且不得与任何生产密钥复用。
