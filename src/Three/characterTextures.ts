import * as THREE from 'three';
import { CharacterId } from '@/types/game';

/**
 * Generates ultra-crisp 512x512 canvas textures for each Mario Party character
 * to be rendered on 3D vertical standee billboards with alpha transparency.
 */
export function createCharacterStandeeTexture(charId: CharacterId): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  // Helper for drop shadow
  const setShadow = (color: string, blur: number, ox: number = 0, oy: number = 4) => {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = ox;
    ctx.shadowOffsetY = oy;
  };
  const clearShadow = () => {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  switch (charId) {
    case 'mario': {
      // 1. Aura glow
      setShadow('#E52521', 24);
      ctx.fillStyle = 'rgba(229, 37, 33, 0.25)';
      ctx.beginPath();
      ctx.ellipse(256, 260, 190, 210, 0, 0, Math.PI * 2);
      ctx.fill();
      clearShadow();

      // Overalls / Body
      setShadow('rgba(0,0,0,0.4)', 12);
      ctx.fillStyle = '#002688'; // Denim Blue
      ctx.beginPath();
      ctx.roundRect(140, 270, 232, 190, 40);
      ctx.fill();

      // Red Shirt
      ctx.fillStyle = '#E52521';
      ctx.beginPath();
      ctx.roundRect(120, 220, 272, 90, 30);
      ctx.fill();

      // White Gloves
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(110, 310, 38, 38, 0, 0, Math.PI * 2);
      ctx.ellipse(402, 310, 38, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Yellow Overall Buttons
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#CA8A04';
      ctx.beginPath();
      ctx.ellipse(190, 305, 14, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(322, 305, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Face
      ctx.fillStyle = '#FFDBAC';
      ctx.beginPath();
      ctx.ellipse(256, 195, 110, 95, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.beginPath();
      ctx.ellipse(150, 195, 22, 32, 0, 0, Math.PI * 2);
      ctx.ellipse(362, 195, 22, 32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Big Round Nose
      ctx.fillStyle = '#F1C27D';
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(256, 188, 44, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Blue Eyes
      const drawEye = (x: number) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x, 155, 18, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#002688';
        ctx.beginPath();
        ctx.ellipse(x, 155, 11, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x, 155, 6, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x - 3, 148, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      drawEye(216);
      drawEye(296);

      // Iconic Black Mustache
      ctx.fillStyle = '#1C1917';
      ctx.beginPath();
      ctx.moveTo(150, 225);
      ctx.bezierCurveTo(190, 190, 230, 235, 256, 222);
      ctx.bezierCurveTo(282, 235, 322, 190, 362, 225);
      ctx.bezierCurveTo(340, 260, 290, 250, 256, 240);
      ctx.bezierCurveTo(222, 250, 172, 260, 150, 225);
      ctx.closePath();
      ctx.fill();

      // Red Cap with Visor
      ctx.fillStyle = '#E52521';
      ctx.beginPath();
      ctx.ellipse(256, 130, 140, 65, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // Cap Brim
      ctx.fillStyle = '#C41E1A';
      ctx.beginPath();
      ctx.ellipse(256, 138, 148, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      // White 'M' Emblem
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#C41E1A';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(256, 88, 48, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#E52521';
      ctx.font = '900 48px "Fredoka", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M', 256, 92);
      break;
    }

    case 'luigi': {
      // 1. Aura glow
      setShadow('#43B047', 24);
      ctx.fillStyle = 'rgba(67, 176, 71, 0.25)';
      ctx.beginPath();
      ctx.ellipse(256, 260, 180, 220, 0, 0, Math.PI * 2);
      ctx.fill();
      clearShadow();

      // Overalls (Taller/Slender)
      setShadow('rgba(0,0,0,0.4)', 12);
      ctx.fillStyle = '#002688';
      ctx.beginPath();
      ctx.roundRect(150, 260, 212, 210, 40);
      ctx.fill();

      // Green Shirt
      ctx.fillStyle = '#43B047';
      ctx.beginPath();
      ctx.roundRect(130, 210, 252, 90, 30);
      ctx.fill();

      // White Gloves
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(120, 310, 36, 36, 0, 0, Math.PI * 2);
      ctx.ellipse(392, 310, 36, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Yellow Buttons
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.ellipse(195, 295, 13, 17, 0, 0, Math.PI * 2);
      ctx.ellipse(317, 295, 13, 17, 0, 0, Math.PI * 2);
      ctx.fill();

      // Slender Face
      ctx.fillStyle = '#FFDBAC';
      ctx.beginPath();
      ctx.ellipse(256, 185, 96, 95, 0, 0, Math.PI * 2);
      ctx.fill();

      // Big Oval Nose
      ctx.fillStyle = '#F1C27D';
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(256, 175, 42, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Blue Eyes
      const drawEye = (x: number) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x, 145, 16, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#002688';
        ctx.beginPath();
        ctx.ellipse(x, 145, 10, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x, 145, 5, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x - 2, 138, 4, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      drawEye(220);
      drawEye(292);

      // Luigi Mustache
      ctx.fillStyle = '#1C1917';
      ctx.beginPath();
      ctx.moveTo(160, 215);
      ctx.bezierCurveTo(195, 185, 230, 225, 256, 215);
      ctx.bezierCurveTo(282, 225, 317, 185, 352, 215);
      ctx.bezierCurveTo(330, 255, 285, 245, 256, 235);
      ctx.bezierCurveTo(227, 245, 182, 255, 160, 215);
      ctx.closePath();
      ctx.fill();

      // Tall Green Cap
      ctx.fillStyle = '#43B047';
      ctx.beginPath();
      ctx.ellipse(256, 115, 130, 75, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // Cap Brim
      ctx.fillStyle = '#2E8B32';
      ctx.beginPath();
      ctx.ellipse(256, 125, 140, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      // White 'L' Emblem
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#2E8B32';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(256, 75, 46, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#43B047';
      ctx.font = '900 46px "Fredoka", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('L', 256, 78);
      break;
    }

    case 'peach': {
      // Aura glow
      setShadow('#E056FD', 24);
      ctx.fillStyle = 'rgba(224, 86, 253, 0.25)';
      ctx.beginPath();
      ctx.ellipse(256, 260, 200, 220, 0, 0, Math.PI * 2);
      ctx.fill();
      clearShadow();

      // Blonde Hair Behind
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.ellipse(256, 220, 160, 160, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pink Flared Gown
      setShadow('rgba(0,0,0,0.4)', 12);
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.moveTo(180, 260);
      ctx.lineTo(80, 480);
      ctx.quadraticCurveTo(256, 510, 432, 480);
      ctx.lineTo(332, 260);
      ctx.closePath();
      ctx.fill();

      // Dark Pink Accents
      ctx.fillStyle = '#EC4899';
      ctx.beginPath();
      ctx.ellipse(256, 290, 80, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Long White Gloves
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(110, 260, 50, 140, 20);
      ctx.roundRect(352, 260, 50, 140, 20);
      ctx.fill();

      // Face
      ctx.fillStyle = '#FFE4E6';
      ctx.beginPath();
      ctx.ellipse(256, 190, 95, 95, 0, 0, Math.PI * 2);
      ctx.fill();

      // Big Sapphire Eyes with Lashes
      const drawPeachEye = (x: number) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x, 175, 18, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0284C7';
        ctx.beginPath();
        ctx.ellipse(x, 175, 12, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x, 175, 6, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x - 3, 168, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyelashes
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, 175, 20, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      };
      drawPeachEye(214);
      drawPeachEye(298);

      // Sweet Pink Lips
      ctx.fillStyle = '#FB7185';
      ctx.beginPath();
      ctx.ellipse(256, 235, 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Blonde Bangs
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.moveTo(170, 150);
      ctx.quadraticCurveTo(256, 180, 342, 150);
      ctx.quadraticCurveTo(256, 90, 170, 150);
      ctx.fill();

      // Golden Crown with Gems
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(180, 100);
      ctx.lineTo(210, 130);
      ctx.lineTo(256, 70); // Middle tall spike
      ctx.lineTo(302, 130);
      ctx.lineTo(332, 100);
      ctx.lineTo(320, 145);
      ctx.lineTo(192, 145);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ruby in center, Sapphires on sides
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.ellipse(256, 115, 10, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.ellipse(206, 125, 7, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(306, 125, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'yoshi': {
      // Aura glow
      setShadow('#00CCFF', 24);
      ctx.fillStyle = 'rgba(0, 204, 255, 0.25)';
      ctx.beginPath();
      ctx.ellipse(256, 260, 200, 210, 0, 0, Math.PI * 2);
      ctx.fill();
      clearShadow();

      // Green Dino Body
      setShadow('rgba(0,0,0,0.4)', 12);
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.ellipse(256, 320, 120, 140, 0, 0, Math.PI * 2);
      ctx.fill();

      // White Belly
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(256, 340, 75, 100, 0, 0, Math.PI * 2);
      ctx.fill();

      // Red Shell on Back
      ctx.fillStyle = '#DC2626';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(140, 310, 32, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Big Round Green Snout
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.ellipse(256, 185, 110, 95, 0, 0, Math.PI * 2);
      ctx.fill();

      // White Lower Cheek/Jaw
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(256, 230, 95, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      // Nostrils
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.ellipse(230, 160, 9, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(282, 160, 9, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Big Tall Friendly Eyes on top
      const drawYoshiEye = (x: number) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#15803D';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(x, 100, 32, 52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.ellipse(x, 105, 16, 32, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x - 4, 90, 8, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      drawYoshiEye(216);
      drawYoshiEye(296);

      // Orange Crests on Head
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.moveTo(350, 140);
      ctx.quadraticCurveTo(400, 160, 360, 200);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'bowser': {
      // Aura glow
      setShadow('#FF6600', 24);
      ctx.fillStyle = 'rgba(255, 102, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(256, 260, 220, 220, 0, 0, Math.PI * 2);
      ctx.fill();
      clearShadow();

      // Big Spiked Green Shell Behind
      setShadow('rgba(0,0,0,0.5)', 16);
      ctx.fillStyle = '#166534';
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.ellipse(256, 260, 180, 180, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Yellow Scales Body
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.ellipse(256, 280, 130, 140, 0, 0, Math.PI * 2);
      ctx.fill();

      // Spiked Arm Bands
      ctx.fillStyle = '#1C1917';
      ctx.beginPath();
      ctx.roundRect(100, 280, 50, 80, 15);
      ctx.roundRect(362, 280, 50, 80, 15);
      ctx.fill();

      // Fiery Red Mane
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.moveTo(170, 120);
      ctx.quadraticCurveTo(256, 20, 342, 120);
      ctx.quadraticCurveTo(290, 70, 256, 50);
      ctx.quadraticCurveTo(222, 70, 170, 120);
      ctx.fill();

      // Huge Yellow Horns
      ctx.fillStyle = '#FEF08A';
      ctx.strokeStyle = '#CA8A04';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(160, 160);
      ctx.quadraticCurveTo(80, 80, 150, 90);
      ctx.closePath();
      ctx.moveTo(352, 160);
      ctx.quadraticCurveTo(432, 80, 362, 90);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bowser Head
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.ellipse(256, 180, 105, 90, 0, 0, Math.PI * 2);
      ctx.fill();

      // Red Fierce Eyes
      const drawBowserEye = (x: number) => {
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.ellipse(x, 150, 18, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.ellipse(x, 150, 10, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x, 150, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      drawBowserEye(212);
      drawBowserEye(300);

      // Heavy Brow
      ctx.fillStyle = '#B45309';
      ctx.beginPath();
      ctx.ellipse(256, 138, 90, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Green Snout with Fangs
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.ellipse(256, 220, 90, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sharp White Fangs
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(200, 200); ctx.lineTo(214, 245); ctx.lineTo(190, 245); ctx.closePath();
      ctx.moveTo(312, 200); ctx.lineTo(326, 245); ctx.lineTo(302, 245); ctx.closePath();
      ctx.fill();
      break;
    }

    case 'toad': {
      // Aura glow
      setShadow('#FFEE00', 24);
      ctx.fillStyle = 'rgba(255, 238, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(256, 260, 190, 210, 0, 0, Math.PI * 2);
      ctx.fill();
      clearShadow();

      // Blue & Gold Vest
      setShadow('rgba(0,0,0,0.4)', 12);
      ctx.fillStyle = '#1D4ED8';
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(160, 280, 192, 160, 30);
      ctx.fill();
      ctx.stroke();

      // White Pants
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(170, 380, 172, 90, 20);
      ctx.fill();

      // Round Cute Face
      ctx.fillStyle = '#FFDBAC';
      ctx.beginPath();
      ctx.ellipse(256, 240, 95, 80, 0, 0, Math.PI * 2);
      ctx.fill();

      // Black Oval Eyes with Sparkles
      const drawToadEye = (x: number) => {
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.ellipse(x, 230, 14, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x - 3, 220, 6, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      drawToadEye(218);
      drawToadEye(294);

      // Sweet Smile
      ctx.strokeStyle = '#9A3412';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(256, 260, 20, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();

      // GIANT White Mushroom Cap with Bold Red Spots
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(256, 140, 165, 110, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center Big Red Spot
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.ellipse(256, 110, 52, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Side Red Spots
      ctx.beginPath();
      ctx.ellipse(135, 145, 32, 44, 0, 0, Math.PI * 2);
      ctx.ellipse(377, 145, 32, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
