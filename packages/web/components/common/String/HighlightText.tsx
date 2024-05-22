import { Box } from '@chakra-ui/react';
import React from 'react';

const HighlightText = ({
  rawText,
  matchText,
  color = 'primary.600'
}: {
  rawText: string;
  matchText: string;
  color?: string;
}) => {

  const searchRegExp = function (nameVal: any) {
    //支持模糊搜索
    let pattr = "("
    let word_map: any = {}
    let num = 0
    //统计字符表，使得不仅要匹配上字符，字符数量是相同的
    nameVal.trim().split("").forEach((word: any) => {
      if (word_map[word]) {
        word_map[word]++;
      }
      else {
        word_map[word] = 1;
      }
    })

    //构造模式匹配字符串
    Object.keys(word_map).forEach((key) => {
      if (num > 0) {
        pattr += "|";
      }
      pattr += key.replace(/\\/g, '\\\\').replace(/\+/g, '\\+');
      num++;
    })
    pattr += ")"
    return pattr;
  }


  const regex = new RegExp(`${searchRegExp(matchText)}`, 'gi');
  const parts = rawText.split(regex);
  const parr = matchText.toLocaleLowerCase().split('');

  return (
    <Box>
      {parts.map((part, index) => {
        if (!part) return;
        let highLight = parr.indexOf(part.toLocaleLowerCase()) !== -1;
        return (
          <Box as="span" key={index} color={highLight ? color : 'inherit'} fontWeight={highLight ? 'bold' : 'inherit'}>
            {part}
          </Box>
        );
      })}
    </Box>
  );
};

export default HighlightText;
