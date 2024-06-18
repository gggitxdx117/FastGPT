import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { connectToDatabase } from '@/service/mongo';
import type { InviteMemberProps } from '@fastgpt/global/support/user/team/controller.d';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { usernames, teamId, permission } = req.body as InviteMemberProps;

    if (!usernames || !teamId || !permission) {
      throw new Error('缺少参数');
    }

    // 检测用户是否存在
    const teamInfo = await MongoTeam.findOne(
      {
        teamId
      },
      'status'
    );
    if (!teamInfo) {
      throw new Error('未找到团队信息');
    }

    // 检测所有用户是否存在
    const userInfos = await MongoUser.find({
      username: { $in: usernames }
    });

    if (!userInfos) {
      throw new Error('未找到相关用户信息');
    }

    // 循环将用户加入到团队中
    let invite = [];
    let inValid = [];
    let inTeam = [];
    for (const userInfo of userInfos) {
      // 记录邀请人
      invite.push({
        userId: userInfo.id,
        username: userInfo.username
      });
      // 检测用户是否已经加入团队
      const isMember = await MongoTeamMember.findOne({
        teamId,
        userId: userInfo.id
      });
      if (isMember) {
        inTeam.push({
          userId: userInfo.id,
          username: userInfo.username
        });
        continue;
      } else {
        // 加入到团队中
        let teamMember = await MongoTeamMember.create({
          teamId,
          userId: userInfo.id,
          name: userInfo.username,
          status: TeamMemberStatusEnum.active,
          createTime: new Date(),
          defaultTeam: true
        });
        // 判断加入是否成功
        if (teamMember) {
          inTeam.push({
            userId: userInfo.id,
            username: userInfo.username
          });
          // 需要加入权限
          if (permission) {
            await MongoResourcePermission.create({
              teamId,
              tmbId: teamMember._id.toString(),
              permission,
              resourceType: PerResourceTypeEnum.team
            });
          }
        } else {
          inValid.push({
            userId: userInfo.id,
            username: userInfo.username
          });
        }
      }
    }

    jsonRes(res, {
      data: {
        invite,
        inValid,
        inTeam
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
