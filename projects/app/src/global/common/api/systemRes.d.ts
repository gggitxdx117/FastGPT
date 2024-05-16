import type {
  LLMModelItemType,
  VectorModelItemType,
  AudioSpeechModels,
  WhisperModelType,
  ReRankModelItemType
} from '@fastgpt/global/core/ai/model.d';

import type { FastGPTFeConfigsType, PresetPromptType } from '@fastgpt/global/common/system/types/index.d';
import { SubPlanType } from '@fastgpt/global/support/wallet/sub/type';

export type InitDateResponse = {
  llmModels: LLMModelItemType[];
  vectorModels: VectorModelItemType[];
  audioSpeechModels: AudioSpeechModels[];
  reRankModels: ReRankModelItemType[];
  whisperModel: WhisperModelType;
  feConfigs: FastGPTFeConfigsType;
  presetPromptlist: PresetPromptType[];
  subPlans?: SubPlanType;
  systemVersion: string;
};
