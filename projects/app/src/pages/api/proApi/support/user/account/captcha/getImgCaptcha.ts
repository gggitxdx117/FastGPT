import type { NextApiRequest, NextApiResponse } from 'next';
import svgCaptcha from 'svg-captcha';
import { jsonRes } from '@fastgpt/service/common/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 生成验证码
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      noise: 2, // 干扰线条数量
      color: true, // 验证码的字符是否有颜色，默认没有，如果设定了背景颜色，则默认有
      background: '#cc9966', // 背景颜色
    });

    // 将验证码文本存储在服务端，通常可以使用内存、数据库或Redis等存储方式
    // 这里简单使用一个变量存储，实际应用中应使用更合适的存储方式
    const captchaText = captcha.text.toLowerCase();

    // 将验证码文本和ID（通常为请求的会话ID）存储起来，这里简化处理
    // 实际应用中，你需要将captchaText和会话ID关联起来，以便后续验证
    // 例如，使用Redis存储：await redis.set(sessionId, captchaText, 'EX', 120);

    // 设置响应头，指定返回的是图片
    res.setHeader('Content-Type', 'image/svg+xml');

    // 返回验证码图片
    res.status(200).send(captcha.data);

    // 如果需要将验证码文本发送给客户端（不推荐），可以通过以下方式
    // jsonRes(res, {
    //   data: { captchaText }
    // });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
