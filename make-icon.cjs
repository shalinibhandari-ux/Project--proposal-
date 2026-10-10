
const sharp = require('sharp');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#071A33"/>
      <stop offset="100%" stop-color="#174A8B"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="90" fill="url(#bg)"/>

  <path d="M256 65 C181 65 125 122 125 198
           C125 285 256 375 256 375
           C256 375 387 285 387 198
           C387 122 331 65 256 65Z"
        fill="#FFFFFF"/>

  <circle cx="256" cy="195" r="53" fill="#0B2850"/>

  <path d="M244 163 L268 163 L281 224 L231 224Z"
        fill="#FFFFFF"/>

  <text x="256" y="449"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="49"
        font-weight="bold"
        letter-spacing="3"
        fill="#FFFFFF">RIDING</text>
</svg>
`;

sharp(Buffer.from(svg))
  .png()
  .toFile('public/icons/icon-512.png')
  .then(() => console.log('PNG icon created successfully!'))
  .catch(err => console.error(err));