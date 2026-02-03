import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

export const getFileInfo = async (filePath) => {
  try {
    const databuffer = await fs.readFile(filePath);
    const parser = new PDFParse(new Uint8Array(databuffer));
    const data = await parser.getText();

    return data.total;
  } catch (error) {
    console.error("Error while getting file info", error);
  }
};
