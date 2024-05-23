import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { TeamSchema as TeamType } from '@fastgpt/global/support/user/team/type.d';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';
import { NextAPI } from '@/service/middleware/entry';
import {
  TeamMemberRoleEnum
} from '@fastgpt/global/support/user/team/constant';


async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  // 凭证校验
  const { tmbId } = await authUserRole({ req, authToken: true, authRoot: true });
  const { userId } = await MongoTeamMember.findOne({ _id: tmbId }).lean();

  const { status } = req.query;

  const params = {
    userId,
    status
  };

  // 查询所在的团队
  const tmbList = await MongoTeamMember.find(params)
    .sort({ defaultTeam: -1, _id: -1 })
    .lean();
  // 查询团队信息
  const teamList = await MongoTeam.find({ _id: { $in: tmbList.map((tmb: any) => tmb.teamId) } }).lean();
  // 处理数据
  const teamObj: Record<
    string,
    TeamType
  > = {};
  teamList.forEach((team: any) => {
    teamObj[team._id.toString()] = team;
  })
  // 补充信息
  tmbList.forEach((tmb: any) => {
    tmb.teamName = teamObj[tmb.teamId.toString()].name;
    tmb.lafAccount = teamObj[tmb.teamId.toString()].lafAccount;
    tmb.balance = teamObj.balance;
    tmb.canWrite = true;
    tmb.tmbId = tmb._id.toString();
    tmb.memberName = tmb.name;
  })

  return tmbList;
}

export default NextAPI(handler);
