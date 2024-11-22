import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { NextAPI } from '@/service/middleware/entry';
import {
  PerResourceTypeEnum,
  ReadPermissionVal
} from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { UpdateAppPermissionProps } from '@fastgpt/global/support/permission/collaborator';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  // 凭证校验
  const { teamId } = await authUserPer({
    req,
    authToken: true,
    authRoot: true,
    per: ReadPermissionVal
  });

  const { appId } = req.query as { appId: string };

  const params = {
    teamId
  };

  // 查询所在的团队
  /* temp: get all tmb and per */
  const [tmbList, rpList] = await Promise.all([
    MongoTeamMember.find(params).sort({ defaultTeam: -1, _id: 1 }).lean(),
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

  return filterTmbList;
}

export default NextAPI(handler);
