# 腾讯云短信配置指南

要发送真实短信验证码，需在 [腾讯云短信控制台](https://console.tencentcloud.com/smsv2) 完成以下步骤。

## 1. 开通服务

- 登录 [腾讯云控制台](https://console.tencentcloud.com/)
- 搜索「短信」→ 进入短信控制台
- 开通「国内短信」服务（需实名认证）

## 2. 创建应用

- 应用管理 → 添加应用
- 获取 **SdkAppId**（如 1400xxxxxx）

## 3. 创建签名

- 国内短信 → 签名管理 → 添加签名
- 签名用途：自用（验证码）
- 提交后等待审批（通常几分钟到 1 天）

## 4. 创建模板

- 国内短信 → 正文模板管理 → 添加模板
- 模板类型：**验证码**
- 模板内容示例：`您的验证码为{1}，10分钟内有效，请勿泄露。`
- `{1}` 为验证码占位符
- 提交后等待审批
- 审批通过后获取 **模板 ID**

## 5. 获取 API 密钥

- [访问管理 → API 密钥](https://console.tencentcloud.com/cam/capi)
- 新建密钥或使用现有密钥
- 获取 **SecretId** 和 **SecretKey**

## 6. 配置 .env

```bash
TENCENT_SMS_SECRET_ID="你的SecretId"
TENCENT_SMS_SECRET_KEY="你的SecretKey"
TENCENT_SMS_SDK_APP_ID="你的SdkAppId"
TENCENT_SMS_SIGN_NAME="你的签名名称"
TENCENT_SMS_TEMPLATE_ID="你的模板ID"
```

## 7. 充值

- 国内短信按条计费，新用户有免费额度
- 控制台 → 套餐包管理 → 购买套餐或按量付费

## 注意事项

- 签名和模板必须审批通过才能发送
- 验证码模板只能有 **1 个变量**（即 `{1}`），对应 6 位验证码
- 测试时可将自己的手机号加入「 test number 白名单」
