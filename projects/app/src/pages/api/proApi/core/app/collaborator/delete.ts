import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { connectToDatabase } from '@/service/mongo';
import type { DelMemberProps } from '@fastgpt/global/support/user/team/controller.d';
import { UpdateClbPermissionProps } from '@fastgpt/global/support/permission/collaborator';
import { putUpdateGroupData } from '@fastgpt/global/support/user/team/group/api';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { GroupMemberRole } from '@fastgpt/global/support/permission/memberGroup/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import {
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { tmbId, appId } = req.query as { tmbId: string, appId: string };
    // 凭证校验
    const { teamId } = await authApp({
      req,
      authToken: true,
      appId,
      per: OwnerPermissionVal
    });

    if (!tmbId || !appId || !teamId) {
      throw new Error('缺少参数');
    }

    // 检测权限是否存在
    const rpInfo = await MongoResourcePermission.findOne(
      {
        resourceType: PerResourceTypeEnum.app,
        resourceId: appId,
        tmbId,
        teamId
      }
    );
    if (!rpInfo) {
      throw new Error('权限不存在');
    }

    await MongoResourcePermission.deleteOne({
      _id: rpInfo._id
    });

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
