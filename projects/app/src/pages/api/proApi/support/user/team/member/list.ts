import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { NextAPI } from '@/service/middleware/entry';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  // 凭证校验
  const { teamId } = await authUserPer({ req, authToken: true, authRoot: true, per: ReadPermissionVal });

  const params = {
    teamId
  };

  // 查询所在的团队
  const tmbList = await MongoTeamMember.find(params)
    .sort({ defaultTeam: -1, _id: 1 })
    .lean();
  // 补充信息
  tmbList.forEach((tmb: any) => {
    tmb.tmbId = tmb._id.toString();
    tmb.memberName = tmb.name;
  })

  return tmbList;
}

export default NextAPI(handler);
