import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const convertToPdf = async (filePath) => {
  try {
    const outputDir = path.dirname(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));
    const outputPath = path.join(outputDir, `${fileName}.pdf`);

    // Check if input file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Input file not found: ${filePath}`);
    }

    // Command to convert to PDF using LibreOffice
    // --headless: run in headless mode (no GUI)
    // --convert-to pdf: convert to PDF
    // --outdir: output directory
    const command = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${filePath}"`;

    console.log(`Executing conversion command: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
        console.warn('LibreOffice stderr:', stderr);
    }
    console.log('LibreOffice stdout:', stdout);

    // Verify output file exists
    if (!fs.existsSync(outputPath)) {
      throw new Error('PDF conversion failed: Output file not created');
    }

    return outputPath;
  } catch (error) {
    console.error('Error converting to PDF:', error);
    throw error;
  }
};
