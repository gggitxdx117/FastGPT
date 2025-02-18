import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { connectToDatabase } from '@/service/mongo';
import type { DelMemberProps } from '@fastgpt/global/support/user/team/controller.d';
import { UpdateAppPermissionProps } from '@fastgpt/global/support/permission/collaborator';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import {
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { permission, appId, members, groups } = req.body as UpdateAppPermissionProps;
    // 凭证校验
    const { teamId } = await authApp({
      req,
      authToken: true,
      appId,
      per: OwnerPermissionVal
    });

    if (!appId || !permission || (!members && !groups)) {
      throw new Error('缺少参数');
    }
    if (groups != undefined && groups?.length > 0) {
      const [rpList] = await Promise.all([
        MongoResourcePermission.find({
          resourceId: appId,
          resourceType: PerResourceTypeEnum.app,
          groupId: { $in: groups }
        }).lean()
      ]);
      groups.map(async (group) => {
        const per = rpList.find((item) => String(item.groupId) === group);
        if (!per) {
          // 添加权限值
          MongoResourcePermission.create({
            teamId: '662241d8e2f7d44d2c737549',
            groupId: group,
            resourceId: appId,
            permission,
            resourceType: PerResourceTypeEnum.app
          });
        } else {
          // 修改权限值
          await MongoResourcePermission.updateOne(
            {
              _id: per._id
            },
            {
              $set: {
                permission
              }
            }
          );
        }
      })
    } else {
      // 查询所在的团队
      /* temp: get all tmb and per */
      const [tmbList, rpList] = await Promise.all([
        MongoTeamMember.find({ _id: { $in: members } })
          .sort({ defaultTeam: -1, _id: 1 })
          .lean(),
        MongoResourcePermission.find({
          resourceId: appId,
          resourceType: PerResourceTypeEnum.app,
          tmbId: { $in: members }
        }).lean()
      ]);
      // 依次写入
      tmbList.map(async (tmb) => {
        const per = rpList.find((item) => String(item.tmbId) === String(tmb._id));
        if (!per) {
          // 添加权限值
          MongoResourcePermission.create({
            teamId: tmb.teamId,
            tmbId: tmb._id,
            resourceId: appId,
            permission,
            resourceType: PerResourceTypeEnum.app
          });
        } else {
          // 修改权限值
          await MongoResourcePermission.updateOne(
            {
              _id: per._id
            },
            {
              $set: {
                permission
              }
            }
          );
        }
      });
    }

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
