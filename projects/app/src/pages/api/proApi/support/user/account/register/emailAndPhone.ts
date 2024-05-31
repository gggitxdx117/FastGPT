import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';
import { connectToDatabase } from '@/service/mongo';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import type { PostRegisterProps } from '@fastgpt/global/support/user/api.d';
import { UserStatusEnum } from '@fastgpt/global/support/user/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { username, password, code } = req.body as PostRegisterProps;

    if (!username || !password || !code) {
      throw new Error('缺少参数');
    }

    // 验证code是否正确
    if (code !== 'dmy666') {
      throw new Error('验证码错误');
    }

    // 检测用户是否存在
    const authCert = await MongoUser.findOne(
      {
        username
      },
      'status'
    );
    if (authCert) {
      throw new Error('用户已注册');
    }

    const user = await MongoUser.create({
      username,
      password,
      "status": "active"
    });

    if (!user) {
      throw new Error('注册失败');
    }

    jsonRes(res, {
      data: {}
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
