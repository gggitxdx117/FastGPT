import { ReadRawTextByBuffer, ReadFileResponse } from '../type';
// import { parseOfficeAsync } from 'officeparser';
import { parseOffice } from '../parseOffice';

export const readPptxRawText = async ({
  buffer,
  encoding
}: ReadRawTextByBuffer): Promise<ReadFileResponse> => {
  if (encoding === 'windows-1252') {
    encoding = 'latin1';
  }
  const result = await parseOffice({
    buffer,
    encoding: encoding as BufferEncoding,
    extension: 'pptx'
  });

  return {
    rawText: result
  };
};
