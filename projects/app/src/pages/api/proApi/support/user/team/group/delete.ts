import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { connectToDatabase } from '@/service/mongo';
import type { DelMemberProps } from '@fastgpt/global/support/user/team/controller.d';
import { UpdateClbPermissionProps } from '@fastgpt/global/support/permission/collaborator';
import { putUpdateGroupData } from '@fastgpt/global/support/user/team/group/api';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { GroupMemberRole } from '@fastgpt/global/support/permission/memberGroup/constant';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import {
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    // 凭证校验
    const { tmbId, teamId } = await authUserPer({
      req,
      authToken: true,
      authRoot: true,
      per: ManagePermissionVal
    });
    if (!tmbId || !teamId) {
      throw new Error('权限不允许');
    }

    const groupId = req.query['groupId'] as string[];

    if (!groupId) {
      throw new Error('缺少参数');
    }

    // 检测群组是否存在
    const teamInfo = await MongoMemberGroupModel.findOne(
      {
        groupId
      }
    );
    if (!teamInfo) {
      throw new Error('群组不存在');
    }

    // 查询所在的团队
    /* temp: get all tmb and per */
    const [rpList] = await Promise.all([
      MongoGroupMemberModel.find({
        groupId
      }).lean()
    ]);

    // 删除群组并删除群组内成员
    await MongoGroupMemberModel.deleteMany({
      groupId
    });
    await MongoMemberGroupModel.deleteOne({
      _id: groupId
    });

    jsonRes(res, {
      code: 200,
      data: {}
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
