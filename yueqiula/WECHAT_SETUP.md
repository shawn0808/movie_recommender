# WeChat Login 微信登录配置

使用微信开放平台 **网站应用** 实现扫码登录 / 注册。

## 前提条件

1. 注册 [微信开放平台](https://open.weixin.qq.com/) 开发者账号
2. 创建 **网站应用**，通过审核后获得 AppID 和 AppSecret
3. 在应用配置中填写 **授权回调域**（如 `yourdomain.com`）或具体回调地址

## 配置步骤

1. 登录 [微信开放平台](https://open.weixin.qq.com/) → 管理中心 → 网站应用

2. 获取 **AppID** 和 **AppSecret**

3. 配置 **授权回调域**：填写你的域名（如 `localhost` 用于本地调试，或 `yourdomain.com` 用于生产）

4. 在项目 `.env` 中添加（需先注册公司后再启用）：

```env
WECHAT_ENABLED="true"
WECHAT_APP_ID="你的AppID"
WECHAT_APP_SECRET="你的AppSecret"
NEXT_PUBLIC_WECHAT_ENABLED="true"
```

5. 确保 `NEXTAUTH_URL` 正确（如 `http://localhost:3000` 或 `https://yourdomain.com`）

## 回调地址

WeChat 会将用户重定向到：

```
{NEXTAUTH_URL}/api/auth/callback/wechat
```

例如：`https://yourdomain.com/api/auth/callback/wechat`

## 流程说明

- **新用户**：微信授权后自动创建账号，并跳转到 `/auth/complete-profile` 完善 NTRP 等信息
- **老用户**：微信授权后直接登录，跳转到首页

## 故障排查

- **redirect_uri 错误**：检查开放平台中配置的授权回调域是否与实际域名一致
- **invalid appid**：确认 WECHAT_APP_ID 正确，无多余空格
- **登录按钮不显示**：设置 `NEXT_PUBLIC_WECHAT_ENABLED="true"` 并重启 dev server
