import type { NextApiResponse } from 'next';
import { MongoChatInputGuide } from '@fastgpt/service/core/chat/inputGuide/schema';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { OutLinkChatAuthProps } from '@fastgpt/global/support/permission/chat';
import { authChatCert } from '@/service/support/permission/auth/chat';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { AppErrEnum } from '@fastgpt/global/common/error/code/app';
import { replaceRegChars } from '@fastgpt/global/common/string/tools';

export type QueryChatInputGuideBody = OutLinkChatAuthProps & {
  appId: string;
  searchKey: string;
  outLinkUid: string;
  shareId: string;
};
export type QueryChatInputGuideResponse = string[];

async function handler(
  req: ApiRequestProps<QueryChatInputGuideBody>,
  res: NextApiResponse<any>
): Promise<QueryChatInputGuideResponse> {
  const { appId, searchKey, outLinkUid, shareId } = req.body;

  // tmp auth
  const { teamId } = await authChatCert({ req, authToken: true });
  const app = await MongoApp.findOne({ _id: appId, teamId });
  if (!app) {
    return Promise.reject(AppErrEnum.unAuthApp);
  }

  // 模糊搜索
  const searchRegExp = function (nameVal: any) {
    //支持模糊搜索
    let pattr = '^';
    let pre_look = '(?=.*';

    let word_map: any = {};
    //统计字符表，使得不仅要匹配上字符，字符数量是相同的
    nameVal
      .trim()
      .split('')
      .forEach((word: any) => {
        let lower = word.toLowerCase();
        if (word_map[lower]) {
          word_map[lower]++;
        } else {
          word_map[lower] = 1;
        }
      });

    //构造模式匹配字符串
    Object.keys(word_map).forEach((key) => {
      let num = word_map[key];
      pattr += pre_look;
      for (let i = 0; i < num; i++) {
        if (i !== 0) pattr += '.*';
        pattr += key.replace(/\\/g, '\\\\').replace(/\+/g, '\\+');
      }
      pattr += ')';
    });
    pattr += '.*';
    // console.log(pattr)
    return pattr;
  };

  const params = {
    appId,
    ...(searchKey && { text: { $regex: new RegExp(searchRegExp(searchKey), 'i') } })
  };

  const result = await MongoChatInputGuide.find(params).sort({ _id: -1 }).limit(10);

  return result
    .map((item) => item.text)
    .filter(Boolean)
    .filter((item) => item !== searchKey);
}

export default NextAPI(handler);
