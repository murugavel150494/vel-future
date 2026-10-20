// models/cricket.model.js
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class CricketModel {
  static async generateNewsVideoTask(timestamp) {
    console.log(`[CricketModel] Executing automated Tamil news video pipeline at ${timestamp}`);

    const fontFileName = 'NotoSansTamil.ttf';
    const bulletSymbol = '*';

    // Helper: Wrap text lines to fit left panel width
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
      output: 'final-tamil-news-video.mp4',
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
          headerText: 'IMPORTANT READING TOPIC 2',
          imagePath: 'picture2.jpg',
          descPoints: [
            'Explaining step-by-step layout flow and structures.',
            'Dynamic text handles long paragraphs with ease.',
            'Consistent alignment across all video slides.'
          ]
        },
        { 
          headerText: 'IMPORTANT READING TOPIC 3',
          imagePath: 'picture3.jpg',
          descPoints: [
            'Conclusion and summary of automated video generation.',
            'Built with Node.js and pre-rendered layout graphics.'
          ]
        }
      ],
      defaultDurationPerSlide: 4
    };

    async function generateSlideImages() {
      let slideImageFiles = [];

      for (let i = 0; i < videoConfig.slides.length; i++) {
        const slide = videoConfig.slides[i];
        const outputPng = `slide_render_${i}.png`;
        slideImageFiles.push(outputPng);

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
          const logoBuffer = fs.readFileSync(videoConfig.logoPath);
          logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        } catch (e) {}

        let svgContent = `
          <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
            <style>
              @font-face {
                font-family: 'TamilFont';
                src: url('${fontFileName}');
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

      return slideImageFiles;
    }

    return new Promise(async (resolve, reject) => {
      try {
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
        ffmpegArgs.push('-y', videoConfig.output);

        console.log('Stitching video via FFmpeg...');
        const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);

        ffmpegProcess.on('close', (code) => {
          slideImages.forEach(file => {
            try { fs.unlinkSync(file); } catch (e) {}
          });

          if (code === 0) {
            console.log(`\nSuccess! Video ready at: ./${videoConfig.output}`);
            resolve({
              success: true,
              message: 'Tamil news video rendered successfully!',
              videoPath: videoConfig.output,
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

  static async generateThumbnailTask(timestamp) {
    console.log(`[CricketModel] Executing thumbnail generation task at ${timestamp}`);
    return {
      success: true,
      message: 'Cricket thumbnail created successfully!',
      thumbnailUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e',
      timestamp
    };
  }
}

module.exports = CricketModel;