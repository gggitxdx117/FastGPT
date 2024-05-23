import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { jsonRes } from '@fastgpt/service/common/response';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';

export type createTeamQuery = {};

export type createTeamBody = {
  name: string;
  avatar: string;
};

export type createTeamResponse = {
  data: any;
};

async function handler(
  req: ApiRequestProps<createTeamBody, createTeamQuery>,
  res: ApiResponseType<any>
) {
  const { name, avatar } = req.body;

  if (!name || !avatar) {
    throw new Error('缺少参数');
  }

  // 凭证校验
  const { tmbId } = await authUserRole({ req, authToken: true, authRoot: true });
  const { userId } = await MongoTeamMember.findOne({ _id: tmbId }).lean();
  const { username } = await MongoUser.findOne({ _id: userId }).lean();
  // 创建模型
  const teamId = await mongoSessionRun(async (session) => {
    const [{ _id: teamId }] = await MongoTeam.create(
      [
        {
          avatar,
          name,
          ownerId: userId
        }
      ],
      { session }
    );

    await MongoTeamMember.create(
      [
        {
          teamId: teamId,
          userId,
          name: username == 'root' ? 'Owner' : username,
          role: TeamMemberRoleEnum.owner,
          status: TeamMemberStatusEnum.active,
          createTime: new Date(),
          defaultTeam: false
        }
      ],
      { session }
    );
    return teamId;
  });
  jsonRes(res, {
    data: teamId
  });
}

export default NextAPI(handler);
