const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create a simple background image for the certificate
function createBackgroundImage() {
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill background with white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Add a subtle gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f9f9f9');
  gradient.addColorStop(1, '#f0f0f0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add some decorative elements
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;

  // Draw decorative border
  ctx.beginPath();
  ctx.moveTo(60, 60);
  ctx.lineTo(width - 60, 60);
  ctx.lineTo(width - 60, height - 60);
  ctx.lineTo(60, height - 60);
  ctx.closePath();
  ctx.stroke();

  // Draw decorative corners
  const cornerSize = 20;
  
  // Top left
  ctx.beginPath();
  ctx.moveTo(60, 60 + cornerSize);
  ctx.lineTo(60, 60);
  ctx.lineTo(60 + cornerSize, 60);
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Top right
  ctx.beginPath();
  ctx.moveTo(width - 60 - cornerSize, 60);
  ctx.lineTo(width - 60, 60);
  ctx.lineTo(width - 60, 60 + cornerSize);
  ctx.stroke();
  
  // Bottom right
  ctx.beginPath();
  ctx.moveTo(width - 60, height - 60 - cornerSize);
  ctx.lineTo(width - 60, height - 60);
  ctx.lineTo(width - 60 - cornerSize, height - 60);
  ctx.stroke();
  
  // Bottom left
  ctx.beginPath();
  ctx.moveTo(60 + cornerSize, height - 60);
  ctx.lineTo(60, height - 60);
  ctx.lineTo(60, height - 60 - cornerSize);
  ctx.stroke();

  // Save the canvas to a PNG file
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(__dirname, 'assets/images/certificate-background.png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Background image created at: ${outputPath}`);
}

// Create the background image
createBackgroundImage();
