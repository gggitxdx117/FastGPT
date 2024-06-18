import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { connectToDatabase } from '@/service/mongo';
import type { DelMemberProps } from '@fastgpt/global/support/user/team/controller.d';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { tmbId } = req.query as DelMemberProps;

    if (!tmbId) {
      throw new Error('缺少参数');
    }

    // 检测用户是否已经加入团队
    const isMember = await MongoTeamMember.findOne({
      _id: tmbId
    });
    if (isMember) {
      // 删除用户
      await MongoTeamMember.deleteOne({
        _id: tmbId
      });

      // 删除用户权限
      await MongoResourcePermission.deleteMany({
        teamId: isMember.teamId,
        tmbId: tmbId,
        resourceType: PerResourceTypeEnum.team
      });

      jsonRes(res, {
        code: 200,
        data: {}
      });
    } else {
      jsonRes(res, {
        code: 500,
        error: '用户不在团队中'
      });
    }
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
