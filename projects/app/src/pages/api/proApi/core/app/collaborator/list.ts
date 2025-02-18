import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { NextAPI } from '@/service/middleware/entry';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { UpdateAppPermissionProps } from '@fastgpt/global/support/permission/collaborator';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import {
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {

  const { appId } = req.query as { appId: string };

  // 凭证校验
  const { teamId } = await authApp({
    req,
    authToken: true,
    appId,
    per: OwnerPermissionVal
  });

  const params = {
    teamId
  };

  // 查询所在的团队
  /* temp: get all tmb and per */
  const [tmbList, tmbGroupList, rpList] = await Promise.all([
    MongoTeamMember.find(params).sort({ defaultTeam: -1, _id: 1 }).lean(),
    MongoMemberGroupModel.find(params).sort({ _id: 1 }).lean(),
    MongoResourcePermission.find({
      resourceType: PerResourceTypeEnum.app,
      resourceId: appId,
      teamId
    }).lean()
  ]);

  const filterTmbList = tmbList
    .map((tmb) => {
      const perVal = rpList.find((item) => String(item.tmbId) === String(tmb._id))?.permission;

      return {
        ...tmb,
        tmbId: tmb._id.toString(),
        permission: {
          'value': perVal ?? 0,
          isOwner: String(tmb.role) === TeamMemberRoleEnum.owner
        }
      };
    })
    .filter((tmb) => tmb.permission.value);

  const filterTmbGroupList = tmbGroupList.map((tmbGroup) => {
    const perVal = rpList.find((item) => String(item.groupId) === String(tmbGroup._id))?.permission;

    return {
      ...tmbGroup,
      groupId: tmbGroup._id.toString(),
      permission: {
        'value': perVal ?? 0,
        isOwner: false
      }
    };
  })
    .filter((tmb) => tmb.permission.value);

  // 合并两个结果
  const result = [...filterTmbList, ...filterTmbGroupList];
  return result;
}

export default NextAPI(handler);
