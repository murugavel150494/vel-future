const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { GoogleGenAI } = require('@google/genai');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

class CricketModel {
  
// Helper to get formatted date identifiers: DDMMYYYY and Filename format
  static getFormattedDateIdentifiers() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    return {
      folderDate: `${dd}${mm}${yyyy}`,
      filename: `Cricket-news-${dd}-${mm}-${yyyy}-${hh}-${min}-${ss}.mp4`
    };
  }

  static async generateNewsVideoTask(timestamp) {
    ffmpeg.setFfmpegPath(ffmpegPath);

    // FIX 1: Corrected font path (.ttf.ttf to .ttf)
    const fontPath = path.join(__dirname, '../fonts/NotoSansTamil.ttf');
    console.log(`[CricketModel] Executing automated Tamil news video pipeline at ${timestamp}`);

    const bulletSymbol = '*';

    // Load and convert Tamil font to Base64 so SVG and Render Linux environment render it cleanly without boxes
    let fontBase64 = '';
    try {
      if (fs.existsSync(fontPath)) {
        const fontBuffer = fs.readFileSync(fontPath);
        fontBase64 = `data:font/ttf;base64,${fontBuffer.toString('base64')}`;
      } else {
        console.warn(`[CricketModelWarning] Font file not found at path: ${fontPath}`);
      }
    } catch (e) {
      console.error('[CricketModelError] Failed to read Tamil font file:', e.message);
    }

    // Get date-based folder and file names
    const { folderDate, filename } = this.getFormattedDateIdentifiers();
    const outputsDir = path.join(__dirname, '../outputs');
    const targetDir = path.join(outputsDir, `video${folderDate}`);

    // Ensure target date folder exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Read existing .mp4 files in this date folder
    const existingFiles = fs.readdirSync(targetDir).filter(file => file.endsWith('.mp4'));

    // 🧹 If folder has 5 or more videos, purge all files in this folder
    if (existingFiles.length >= 5) {
      console.log(`[CricketModel] Folder video${folderDate} reached ${existingFiles.length} videos. Purging all files...`);
      for (const file of existingFiles) {
        const filePathToDelete = path.join(targetDir, file);
        if (fs.existsSync(filePathToDelete)) {
          fs.unlinkSync(filePathToDelete);
        }
      }
    }

    const finalVideoOutputPath = path.join(targetDir, filename);
    const relativeVideoPath = `video${folderDate}/${filename}`;

    function wrapTextToLines(text, maxCharsPerLine = 36) {
      const words = text.split(' ');
      let lines = [];
      let currentLine = '';

      for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
          currentLine = currentLine ? currentLine + ' ' + word : word;
        } else {
          lines.push(currentLine);
          currentLine = `    ${word}`;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    }

    const videoConfig = {
      totalWidth: 1280,
      height: 720,
      fps: 30,
      bgColor: '#0b1d3a',
      fontColor: '#ffffff',
      logoPath: 'logo.png',
      slides: [
        {
          headerText: 'பிட்ச் தன்மையை கடுமையாக சாடிய கௌதம் கம்பீர்!',
          imagePath: 'picture1.jpg',
          descPoints: [
            "இந்திய கிரிக்கெட்டில் பிட்ச்கள் வெறும் பேட்டிங்குக்கு மட்டுமே சாதகமாக மாறுவது பவுலர்களின் எதிர்காலத்தை காலி செய்யும் என ஹெட் கோச் எச்சரித்துள்ளார்.",
            "இதுகுறித்து BCCI நிர்வாகத்திடம் அவர் விடுத்த கடுமையான வார்னிங் பரபரப்பை ஏற்படுத்தியுள்ளது.",
            "குறிப்பாக இளம் ஃபாஸ்ட் பவுலர்கள் மற்றும் ஸ்பின்னர்களின் திறமை வீணடிக்கப்படுவதாக கவலை தெரிவித்துள்ளார்."
          ]
        },
        {
          headerText: 'வேகப்பந்து வீச்சாளர்களுக்கு தனி பயிற்சி முகாம்!',
          imagePath: 'picture2.jpg',
          descPoints: [
            'அடுத்த தொடருக்கு முன்பாக வேகப்பந்து வீச்சாளர்களின் பணிச்சுமையை குறைக்க திட்டம்.',
            'தேசிய கிரிக்கெட் அகாடமியில் சிறப்பு பயிற்சி முகாம் நடத்த பிசிசிஐ முடிவெடுத்துள்ளது.',
            'இளம் வீரர்களுக்கு மூத்த பவுலர்கள் வழிகாட்ட ஏற்பாடு.'
          ]
        },
        {
          headerText: 'ரசிகர்களின் எதிர்பார்ப்பும் அடுத்த கட்ட நடவடிக்கைகளும்',
          imagePath: 'picture3.jpg',
          descPoints: [
            'ஹெட் கோச்சின் இந்த முயற்சி இந்திய அணியின் பந்துவீச்சை வலுப்படுத்தும் என நம்பிக்கை.',
            'வரவிருக்கும் தொடர்களில் பிட்ச் அமைப்பில் மாற்றங்கள் இருக்கும் என எதிர்பார்ப்பு.'
          ]
        }
      ],
      defaultDurationPerSlide: 4
    };

    const tempSlideImages = [];

    async function generateSlideImages() {
      for (let i = 0; i < videoConfig.slides.length; i++) {
        const slide = videoConfig.slides[i];
        const outputPng = path.join(targetDir, `slide_render_${Date.now()}_${i}.png`);
        tempSlideImages.push(outputPng);

        let processedImgBuffer;
        try {
          const originalImage = sharp(slide.imagePath);
          const metadata = await originalImage.metadata();

          const targetW = 480;
          const targetH = 720;
          const ratio = Math.min(targetW / metadata.width, targetH / metadata.height);
          const resizedW = Math.round(metadata.width * ratio);
          const resizedH = Math.round(metadata.height * ratio);

          const resizedBuffer = await originalImage
            .resize(resizedW, resizedH)
            .toBuffer();

          const leftOffset = Math.round((targetW - resizedW) / 2);
          const topOffset = Math.round((targetH - resizedH) / 2) - 40;

          processedImgBuffer = await sharp({
            create: {
              width: targetW,
              height: targetH,
              channels: 4,
              background: videoConfig.bgColor
            }
          })
            .composite([{ input: resizedBuffer, left: leftOffset, top: topOffset }])
            .png()
            .toBuffer();

        } catch (e) {
          processedImgBuffer = await sharp({
            create: { width: 480, height: 720, channels: 4, background: videoConfig.bgColor }
          }).png().toBuffer();
        }

        const imgBase64 = `data:image/png;base64,${processedImgBuffer.toString('base64')}`;

        let logoBase64 = '';
        try {
          if (fs.existsSync(videoConfig.logoPath)) {
            const logoBuffer = fs.readFileSync(videoConfig.logoPath);
            logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
          }
        } catch (e) { }

        // FIX 2: Embedded base64 font inside SVG style so Linux/Render renders Tamil characters correctly
        let svgContent = `
          <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
            <style>
              @font-face {
                font-family: 'TamilFont';
                src: url('${fontBase64}');
              }
              .header { font-family: 'TamilFont', sans-serif; font-size: 26px; fill: ${videoConfig.fontColor}; font-weight: bold; }
              .body { font-family: 'TamilFont', sans-serif; font-size: 20px; fill: ${videoConfig.fontColor}; }
            </style>
            
            <rect width="1280" height="720" fill="${videoConfig.bgColor}"/>
            <image href="${imgBase64}" x="800" y="0" width="480" height="720"/>
            <image href="${logoBase64}" x="40" y="35" width="40" height="40" opacity="0.3"/>
            <text x="100" y="65" class="header">${slide.headerText}</text>
        `;

        let currentY = 160;
        slide.descPoints.forEach(point => {
          const wrappedLines = wrapTextToLines(point, 36);
          svgContent += `<text x="50" y="${currentY}" class="body" font-weight="bold">${bulletSymbol}</text>`;

          wrappedLines.forEach((line) => {
            svgContent += `<text x="80" y="${currentY}" class="body">${line}</text>`;
            currentY += 30;
          });
          currentY += 20;
        });

        svgContent += `</svg>`;

        await sharp(Buffer.from(svgContent))
          .png()
          .toFile(outputPng);
      }

      return tempSlideImages;
    }

    async function generateSEOAndThumbnailPrompt() {
      const rawTextContent = videoConfig.slides.map(slide => {
        const headline = slide.headerText || '';
        const details = Array.isArray(slide.descPoints) ? slide.descPoints.join(' ') : '';
        return `${headline}: ${details}`;
      }).join(' ');

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const fallbackHeadline = videoConfig.slides[0]?.headerText || "கிரிக்கெட் செய்தி";
        return {
          seoDetails: {
            bestTitle: `${fallbackHeadline} | Gautam Gambhir Warning to BCCI`,
            alternativeTitles: [
              `பிட்ச் விவகாரத்தில் கம்பீர் அதிரடி | Indian Cricket Pitch Controversy`,
              `பிசிசிஐ எடுத்த முக்கிய முடிவு | Team India Fast Bowlers Special Camp`
            ],
            description: rawTextContent + " #CricketTamil #TeamIndia #BCCI",
            tags: ["Cricket Tamil", "Gautam Gambhir", "Team India", "BCCI", "Tamil Sports News"]
          },
          thumbnailDetails: {
            primaryOption: {
              headingText: "பிட்ச் விவகாரம்: கம்பீர் அதிரடி எச்சரிக்கை!",
              visualPrompt: "A dramatic cinematic sports photo of Indian head coach Gautam Gambhir looking intense during a stadium press conference, dark high contrast lighting, sports journalism photography, 4k"
            },
            secondaryOption: {
              headingText: "வேகப்பந்து வீச்சாளர்களுக்கு புதிய பிளான்!",
              visualPrompt: "A dramatic low angle shot of an Indian fast bowler bowling on a cricket pitch under bright stadium floodlights, dynamic action motion blur, 4k resolution"
            }
          }
        };
      }

      try {
        const ai = new GoogleGenAI({ apiKey });
        const promptText = `
          You are a top YouTube SEO strategist and thumbnail designer for a viral Tamil cricket channel.
          Analyze the following cricket news content across all slides and generate YouTube SEO metadata and thumbnail specifications.

          NEWS CONTENT:
          ${rawTextContent}

          OUTPUT RULES:
          1. "bestTitle": Combine Tamil and English separated by a pipe symbol "|". Example: "தமிழ் தலைப்பு | English Title". Under 70 characters.
          2. "alternativeTitles": Provide 2 alternative titles following the exact "Tamil | English" format.
          3. "description": Write a single, clean, cohesive narrative paragraph in Tamil summarizing the news. DO NOT include line breaks or slide numbers. End with relevant hashtags.
          4. "tags": Provide 12 to 18 trending, high-volume search tags (mix of Tamil and English terms).
          5. "thumbnailDetails": Provide two distinct thumbnail variations:
             - "primaryOption":
                - "headingText": A short, high-CTR, 3 to 6 word Tamil headline (under 35 characters).
                - "visualPrompt": Pure ENGLISH image prompt describing the primary visual scene. NO Tamil characters.
             - "secondaryOption":
                - "headingText": An alternative punchy 3 to 6 word Tamil headline.
                - "visualPrompt": Pure ENGLISH image prompt describing a complementary visual scene. NO Tamil characters.

          Return ONLY a valid JSON object matching this structure (no markdown fences or code blocks):
          {
            "seoDetails": {
              "bestTitle": "Tamil Title | English Title",
              "alternativeTitles": [
                "Tamil Alt 1 | English Alt 1",
                "Tamil Alt 2 | English Alt 2"
              ],
              "description": "Clean Tamil narrative text #hashtags",
              "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
            },
            "thumbnailDetails": {
              "primaryOption": {
                "headingText": "முதன்மை தமிழ் தலைப்பு",
                "visualPrompt": "Primary English visual description for photo generation"
              },
              "secondaryOption": {
                "headingText": "இரண்டாவது தமிழ் தலைப்பு",
                "visualPrompt": "Secondary English visual description for photo generation"
              }
            }
          }
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptText
        });

        const textResponse = response.text ? response.text.trim() : '';
        const cleanedJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedJson);
      } catch (error) {
        console.error('Error generating dynamic AI SEO metadata, using fallback:', error.message);
        const fallbackHeadline = videoConfig.slides[0]?.headerText || "கிரிக்கெட் செய்தி";
        return {
          seoDetails: {
            bestTitle: `${fallbackHeadline} | Gautam Gambhir Pitch Statement`,
            alternativeTitles: [`பிசிசிஐக்கு எச்சரிக்கை விடுத்த கம்பீர் | BCCI Warned By Gautam Gambhir`],
            description: rawTextContent + " #CricketTamil #TeamIndia #BCCI",
            tags: ["Cricket Tamil", "Gautam Gambhir", "Team India", "BCCI"]
          },
          thumbnailDetails: {
            primaryOption: {
              headingText: "பிட்ச் விவகாரத்தில் கம்பீர் அதிரடி!",
              visualPrompt: "A dramatic cinematic shot of Indian cricket coach Gautam Gambhir standing on a cricket pitch under stadium floodlights, highly detailed, 4k"
            },
            secondaryOption: {
              headingText: "பிசிசிஐக்கு கம்பீர் கொடுத்த எச்சரிக்கை!",
              visualPrompt: "Close up portrait of an intense cricket coach gesturing during a press conference under bright studio lights, 4k resolution"
            }
          }
        };
      }
    }

    return new Promise(async (resolve, reject) => {
      try {
        console.log(`Generating dynamic SEO metadata and Thumbnail prompt across all slides via Gemini...`);
        const metadataResult = await generateSEOAndThumbnailPrompt();

        console.log(`Rendering ${videoConfig.slides.length} Tamil slides via Sharp...`);
        const slideImages = await generateSlideImages();

        let ffmpegArgs = [];
        let filterParts = [];

        slideImages.forEach((imgFile, idx) => {
          ffmpegArgs.push('-loop', '1', '-t', videoConfig.defaultDurationPerSlide.toString(), '-i', imgFile);
          filterParts.push(`[${idx}:v]fps=${videoConfig.fps},format=yuv420p[s${idx}]`);
        });

        let concatStr = '';
        slideImages.forEach((_, idx) => {
          concatStr += `[s${idx}]`;
        });
        concatStr += `concat=n=${slideImages.length}:v=1:a=0[outv]`;
        filterParts.push(concatStr);

        ffmpegArgs.push('-filter_complex', filterParts.join(';'));
        ffmpegArgs.push('-map', '[outv]');
        ffmpegArgs.push('-c:v', 'libx264');
        ffmpegArgs.push('-preset', 'ultrafast');
        ffmpegArgs.push('-pix_fmt', 'yuv420p');
        ffmpegArgs.push('-y', finalVideoOutputPath);

        console.log('Stitching video via FFmpeg...');
        const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);

        ffmpegProcess.on('close', (code) => {
          // Cleanup temporary slide image renders
          slideImages.forEach(file => {
            try { fs.unlinkSync(file); } catch (e) { }
          });

          if (code === 0) {
            console.log(`\nSuccess! Video ready at: ${relativeVideoPath}`);
            resolve({
              success: true,
              message: 'Dynamic news video, optimized SEO metadata, and thumbnail specs generated successfully!',
              videoPath: relativeVideoPath, // Returns "videoDDMMYYYY/Cricket-news-..."
              seoDetails: metadataResult.seoDetails,
              thumbnailDetails: metadataResult.thumbnailDetails,
              timestamp
            });
          } else {
            reject(new Error(`FFmpeg process exited with error code ${code}`));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static async generateThumbnailTask(timestamp, customHeadline = "பிட்ச் விவகாரத்தில் கம்பீர் அதிரடி!", customPrompt = null) {
    const fontFileName = 'NotoSansTamil.ttf';
    const { folderDate } = this.getFormattedDateIdentifiers();
    const targetDir = path.join(__dirname, '../outputs', `video${folderDate}`);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const outputThumbnailPath = path.join(`video${folderDate}`, `cricket_thumbnail_${Date.now()}.jpg`);
    const fullThumbnailPath = path.join(__dirname, '../outputs', outputThumbnailPath);

    try {
      const defaultVisualPrompt = "A dramatic cinematic shot of Indian cricket coach Gautam Gambhir looking intense and serious in a stadium press room, high contrast, sports photojournalism style, 4k";

      let rawPrompt = customPrompt || defaultVisualPrompt;
      let cleanPrompt = rawPrompt
        .replace(/[^\x00-\x7F]/g, "")
        .replace(/[^a-zA-Z0-9\s,]/g, "")
        .trim()
        .substring(0, 200);

      if (!cleanPrompt) {
        cleanPrompt = "A dramatic cinematic shot of cricket stadium floodlights, highly detailed, 4k";
      }

      let bgBase64 = '';

      try {
        console.log(`Generating base AI image with clean prompt: "${cleanPrompt}"...`);
        const aiImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1280&height=720&nologo=true&seed=${Date.now()}`;

        const aiImageResponse = await axios.get(aiImageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000
        });

        const bgImageBuffer = Buffer.from(aiImageResponse.data);
        bgBase64 = `data:image/jpeg;base64,${bgImageBuffer.toString('base64')}`;
      } catch (apiError) {
        console.warn(`⚠️ AI Image API returned error (${apiError.message}). Falling back to local Sharp canvas...`);

        if (fs.existsSync('picture1.jpg')) {
          const localImgBuffer = fs.readFileSync('picture1.jpg');
          bgBase64 = `data:image/jpeg;base64,${localImgBuffer.toString('base64')}`;
        } else {
          const fallbackBg = await sharp({
            create: { width: 1280, height: 720, channels: 4, background: '#0b1d3a' }
          }).png().toBuffer();
          bgBase64 = `data:image/png;base64,${fallbackBg.toString('base64')}`;
        }
      }

      let logoBase64 = '';
      try {
        if (fs.existsSync('logo.png')) {
          const logoBuffer = fs.readFileSync('logo.png');
          logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }
      } catch (e) { }

      const svgThumbnail = `
        <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
          <style>
            @font-face {
              font-family: 'TamilFont';
              src: url('${fontFileName}');
            }
            .headline {
              font-family: 'TamilFont', sans-serif;
              font-size: 52px;
              font-weight: bold;
              fill: #ffffff;
            }
            .highlight {
              font-family: 'TamilFont', sans-serif;
              font-size: 52px;
              font-weight: bold;
              fill: #ffeb3b;
            }
          </style>

          <image href="${bgBase64}" x="0" y="0" width="1280" height="720" preserveAspectRatio="xMidYMid slice"/>

          <defs>
            <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#000000" stop-opacity="0.95"/>
              <stop offset="60%" stop-color="#000000" stop-opacity="0.80"/>
              <stop offset="85%" stop-color="#000000" stop-opacity="0.30"/>
              <stop offset="100%" stop-color="#000000" stop-opacity="0.0"/>
            </linearGradient>
          </defs>

          <rect width="1280" height="720" fill="url(#textGrad)"/>

          ${logoBase64 ? `<image href="${logoBase64}" x="1150" y="40" width="80" height="80"/>` : ''}

          <text x="70" y="320" class="headline">
            <tspan x="70" dy="0">${customHeadline.substring(0, 28)}</tspan>
            ${customHeadline.length > 28 ? `<tspan x="70" dy="70" class="highlight">${customHeadline.substring(28, 56)}</tspan>` : ''}
            ${customHeadline.length > 56 ? `<tspan x="70" dy="70">${customHeadline.substring(56, 85)}</tspan>` : ''}
          </text>

          <rect x="0" y="650" width="1280" height="70" fill="#0b1d3a" opacity="0.95"/>
          <text x="70" y="694" font-family="'TamilFont', sans-serif" font-size="24px" fill="#00e5ff" font-weight="bold">
            CRICKET TAMIL UPDATES • நேரலை உடனுக்குடன்
          </text>
        </svg>
      `;

      await sharp(Buffer.from(svgThumbnail))
        .jpeg({ quality: 95 })
        .toFile(fullThumbnailPath);

      console.log(`Success! High-impact thumbnail created at: ${outputThumbnailPath}`);
      return outputThumbnailPath;

    } catch (error) {
      console.error('Error generating thumbnail:', error.message);
      throw error;
    }
  }
}

module.exports = CricketModel;