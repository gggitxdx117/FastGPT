import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';
import { connectToDatabase } from '@/service/mongo';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import type { PostRegisterProps } from '@fastgpt/global/support/user/api.d';
import { UserStatusEnum } from '@fastgpt/global/support/user/constant';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';

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

    // 检测用户邮箱是否为@yishouapp.com
    if (!username.includes('@yishouapp.com')) {
      throw new Error('邮箱格式不正确');
    }

    const user = await MongoUser.create({
      username,
      password,
      "status": "active"
    });

    if (!user) {
      throw new Error('注册失败');
    }

    const permission = 6;
    const members = [user._id];
    // 加入到团队中
    let teamMember = await MongoTeamMember.create({
      teamId: '662241d8e2f7d44d2c737549',
      userId: user._id,
      name: username,
      status: TeamMemberStatusEnum.active,
      createTime: new Date(),
      defaultTeam: true
    });
    // 判断加入是否成功
    if (!teamMember) {
      throw new Error('加入团队失败，请联系管理员');
    }
    // 添加权限值
    MongoResourcePermission.create({
      teamId: '662241d8e2f7d44d2c737549',
      tmbId: teamMember._id,
      permission,
      resourceType: PerResourceTypeEnum.team
    });

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
