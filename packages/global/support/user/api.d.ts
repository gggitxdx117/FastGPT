import { OAuthEnum } from './constant';

export type PostLoginProps = {
  username: string;
  password: string;
};

export type PostRegisterProps = {
  username: string;
  password: string;
  code: string;
};

export type OauthLoginProps = {
  type: `${OAuthEnum}`;
  code: string;
  callbackUrl: string;
  inviterId?: string;
};

export type WxLoginProps = {
  inviterId?: string;
  code: string;
};

export type FastLoginProps = {
  token: string;
  code: string;
};
