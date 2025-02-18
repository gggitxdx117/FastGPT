import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import {
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { postCreateGroupData } from '@fastgpt/global/support/user/team/group/api';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { connectToDatabase } from '@/service/mongo';
import type { InviteMemberProps } from '@fastgpt/global/support/user/team/controller.d';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { DefaultGroupName } from '@fastgpt/global/support/user/team/group/constant';
import { GroupMemberRole } from '@fastgpt/global/support/permission/memberGroup/constant';

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

    const { name, avatar } = req.body as postCreateGroupData;

    if (!name || !avatar) {
      throw new Error('缺少参数');
    }
    if (name == DefaultGroupName) {
      throw new Error('群组名称不能为' + DefaultGroupName);
    }

    // 检测群组是否存在
    const teamInfo = await MongoMemberGroupModel.findOne(
      {
        name
      }
    );
    if (teamInfo) {
      throw new Error('群组已经存在，请重新命名');
    }

    // 创建群组
    const group = await MongoMemberGroupModel.create({
      name,
      avatar,
      teamId,
      createTime: new Date()
    });

    // 添加群组成员，所有权
    await MongoGroupMemberModel.create({
      groupId: group._id,
      tmbId: tmbId,
      role: GroupMemberRole.owner
    })

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
