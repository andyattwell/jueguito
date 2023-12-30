import {ImprovedNoise} from './lib/ImprovedNoise.js';
import * as THREE from 'three';

class NoiseGenerator {
  /**
   * Antti Sykäri's algorithm to get random number based on seed
   * @param {*} seed 
   * @returns 
   */
    random(seed) {
      return function() {
          seed = Math.sin(seed) * 10000; return seed - Math.floor(seed);
      };
    };

	generateNoiseMap(mapWidth, mapHeight, seed, scale, octaves, persistance, lacunarity, offset) {
		let noiseMap = new Array(mapHeight);
		const prng = this.random(seed);
		const octaveOffsets = new Array(octaves);

		for (let i = 0; i < octaves; i++) {
			let offsetX = prng() + offset.x;
			let offsetY = prng() + offset.y;
			octaveOffsets[i] = new THREE.Vector2(offsetX, offsetY);
		}

		if (scale <= 0) {
			scale = 0.0001;
		}

		let maxNoiseHeight = Number.MIN_VALUE;
		let minNoiseHeight = Number.MAX_VALUE;

		let halfWidth = mapWidth / 2;
		let halfHeight = mapHeight / 2;

    const noise = new ImprovedNoise()

		for (let y = 0; y < mapHeight - 1; y++) {
      noiseMap[y] = new Array(this.mapWidth);
			for (let x = 0; x < mapWidth - 1; x++) {
		
				let amplitude = 1;
				let frequency = 1;
				let noiseHeight = 0;

				for (let i = 0; i < octaves; i++) {
					let sampleX = ((x-halfWidth)) * scale * frequency + octaveOffsets[i].x;
					let sampleY = ((y-halfWidth)) * scale * frequency + octaveOffsets[i].y;

          let perlinValue = noise.noise(sampleX, sampleY, 0) * 2 - 1
					noiseHeight += perlinValue * amplitude;
          
					amplitude *= persistance;
					frequency *= lacunarity;
				}

				if (noiseHeight > maxNoiseHeight) {
					maxNoiseHeight = noiseHeight;
				} else if (noiseHeight < minNoiseHeight) {
					minNoiseHeight = noiseHeight;
				}
        

				noiseMap[y][x] = noiseHeight;
			}
		}

		for (let y = 0; y < mapHeight - 1; y++) {
			for (let x = 0; x < mapWidth - 1; x++) {
				noiseMap[y][x] = THREE.MathUtils.inverseLerp(minNoiseHeight, maxNoiseHeight, noiseMap[y][x]);
			}
		}

		return noiseMap;
	}

}

export default NoiseGenerator;