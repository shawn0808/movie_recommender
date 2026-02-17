/**
 * WeChat OAuth provider for NextAuth
 * 微信开放平台 - 网站应用 (Website App) - QR code login
 * https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
 */
import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";

export interface WeChatProfile {
  openid: string;
  nickname?: string;
  sex?: number;
  province?: string;
  city?: string;
  country?: string;
  headimgurl?: string;
  privilege?: string[];
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export default function WeChat(
  options: OAuthUserConfig<WeChatProfile>
): OAuthConfig<WeChatProfile> {
  const { clientId, clientSecret } = options;

  return {
    id: "wechat",
    name: "WeChat",
    type: "oauth",
    version: "2.0",
    clientId,
    clientSecret,
    checks: ["state"],
    style: {
      logo: "/wechat.svg",
      bg: "#07C160",
      text: "#fff",
    },
    authorization: {
      url: "https://open.weixin.qq.com/connect/qrconnect",
      params: {
        appid: clientId,
        scope: "snsapi_login",
        response_type: "code",
      },
    },
    token: {
      url: "https://api.weixin.qq.com/sns/oauth2/access_token",
      async request({ params, provider }) {
        const url = new URL(provider.token?.url as string);
        url.searchParams.set("appid", provider.clientId!);
        url.searchParams.set("secret", provider.clientSecret!);
        url.searchParams.set("code", params.code!);
        url.searchParams.set("grant_type", "authorization_code");
        const res = await fetch(url.toString());
        const data = await res.json();
        if (data.errcode) {
          throw new Error(data.errmsg || "WeChat token error");
        }
        return {
          tokens: {
            access_token: data.access_token,
            expires_in: data.expires_in,
            refresh_token: data.refresh_token,
            openid: data.openid,
            scope: data.scope,
            unionid: data.unionid,
            token_type: "bearer",
          } as Record<string, unknown>,
        };
      },
    },
    userinfo: {
      url: "https://api.weixin.qq.com/sns/userinfo",
      async request({ tokens, provider }) {
        const openid = (tokens as Record<string, string>).openid;
        const access_token = (tokens as Record<string, string>).access_token;
        if (!openid || !access_token) return {};
        const url = new URL(provider.userinfo?.url as string);
        url.searchParams.set("access_token", access_token);
        url.searchParams.set("openid", openid);
        url.searchParams.set("lang", "zh_CN");
        const res = await fetch(url.toString());
        const data = await res.json();
        if (data.errcode) return {};
        return data;
      },
    },
    profile(profile: WeChatProfile) {
      const id = profile.unionid || profile.openid;
      return {
        id,
        name: profile.nickname || undefined,
        email: undefined,
        image: profile.headimgurl || undefined,
      };
    },
    options,
  };
}
