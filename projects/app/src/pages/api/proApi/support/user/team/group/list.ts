import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { NextAPI } from '@/service/middleware/entry';
import {
  PerResourceTypeEnum,
  ReadPermissionVal
} from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  // 凭证校验
  const { teamId } = await authUserPer({
    req,
    authToken: true,
    authRoot: true,
    per: ReadPermissionVal
  });

  const params = {
    teamId
  };

  // 查询所在的团队
  /* temp: get all tmb and per */
  const [tmbList, rpList, groupList, groupMemberList] = await Promise.all([
    MongoTeamMember.find(params).sort({ defaultTeam: -1, _id: 1 }).lean(),
    MongoResourcePermission.find({
      resourceType: PerResourceTypeEnum.team,
      teamId
    }).lean(),
    MongoMemberGroupModel.find({
      teamId
    }).lean(),
    MongoGroupMemberModel.find({
      teamId
    }).lean()
  ]);

  const defaultMembers = tmbList
    .map((tmb) => {
      const perVal = rpList.find((item) => String(item.tmbId) === String(tmb._id))?.permission;
      const Per = new TeamPermission({
        per: perVal ?? 0,
        isOwner: String(tmb.role) === TeamMemberRoleEnum.owner
      });

      return {
        ...tmb,
        tmbId: tmb._id.toString(),
        memberName: tmb.name,
        permission: Per
      };
    })
    .filter((tmb) => tmb.permission.value);
  
  const groupListFiltered = groupList.map((group) => {
    const members = groupMemberList
      .filter((groupMember) => String(groupMember.groupId) === String(group._id))
      .map((groupMember) => {
        const tmb = tmbList.find((tmb) => String(tmb._id) === String(groupMember.tmbId));
        if (!tmb) {
          return null;
        };
        return {...tmb, tmbId: tmb._id.toString(), role: groupMember.role};
      })
    return {
      ...group,
      members: members
    }
  })

  return [...groupListFiltered];
}

export default NextAPI(handler);
