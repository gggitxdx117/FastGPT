import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
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

    const { groupId, memberList } = req.body as putUpdateGroupData;

    if (!memberList || !groupId) {
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

    // 依次写入
    memberList.map(async (tmb) => {
      const per = rpList.find((item) => String(item.tmbId) === String(tmb.tmbId));
      if (!per) {
        // 添加权限值
        await MongoGroupMemberModel.create({
          groupId,
          tmbId: tmb.tmbId,
          role: tmb.role
        });
      } else {
        // 更新权限值
        await MongoGroupMemberModel.updateOne(
          {
            _id: per._id
          },
          {
            $set: {
              role: tmb.role
            }
          }
        );
      }
    });

    // 还需要删除不在memberList中的成员
    rpList.map(async (item) => {
      if (!memberList.find((tmb) => String(tmb.tmbId) === String(item.tmbId))) {
        await MongoGroupMemberModel.deleteOne({
          _id: item._id
        });
      }
    })

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
