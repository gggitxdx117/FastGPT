import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  // 凭证校验
  const { teamId } = await authUserRole({ req, authToken: true, authRoot: true });

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
