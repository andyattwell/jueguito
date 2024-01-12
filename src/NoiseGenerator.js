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

	generateNoiseMap(options = {}) {
		let mapAltitude = options.mapAltitude ? parseInt(options.mapAltitude) : null;
    if (mapAltitude && mapAltitude > 0) {
      mapAltitude = mapAltitude * .1;
    } else if (mapAltitude && mapAltitude < 0) {
      mapAltitude = 0.1
    }

    let mapWidth = options.mapWidth ? parseInt(options.mapWidth) : this.cols;
    let mapDepth = options.mapDepth ? parseInt(options.mapDepth) : this.rows;
    // this.mapSeed = options.mapSeed ? parseFloat(options.mapSeed) : Math.random();
    let seed = options.mapSeed ? parseFloat(options.mapSeed) : Math.random();
    let scale = options.mapNoiseScale ? parseFloat(options.mapNoiseScale) : this.mapSeed * .3;
    let octaves = options.mapNoiseOctaves ? parseInt(options.mapNoiseOctaves) : 3;
    let persistance = options.mapNoisePersistance ? parseFloat(options.mapNoisePersistance) : this.mapSeed;
    let lacunarity = options.mapNoiseLacunarity ? parseFloat(options.mapNoiseLacunarity) : this.mapSeed;
    let offset = options.offset ? options.offset : {
      x:  this.mapSeed * 1000,
      y:  this.mapSeed * 1000
    };

    offset.x = parseInt(offset.x)
    offset.y = parseInt(offset.y)

		let noiseMap = new Array(mapDepth);
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
		let halfHeight = mapDepth / 2;

    const noise = new ImprovedNoise()
		for (let x = 0; x < mapWidth; x++) {
      noiseMap[x] = new Array(mapDepth);
			for (let y = 0; y < mapDepth; y++) {
		
				let amplitude = 1;
				let frequency = 1;
				let noiseHeight = 0;

				for (let i = 0; i < octaves; i++) {
					let sampleX = ((x-halfWidth)) * scale * frequency + octaveOffsets[i].x;
					let sampleY = ((y-halfHeight)) * scale * frequency + octaveOffsets[i].y;

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
        

				noiseMap[x][y] = noiseHeight;
			}
		}

		for (let x = 0; x < mapWidth; x++) {
			for (let y = 0; y < mapDepth; y++) {
				noiseMap[x][y] = THREE.MathUtils.inverseLerp(minNoiseHeight, maxNoiseHeight, noiseMap[x][y]);
			}
		}

		return noiseMap;
	}

}

export default NoiseGenerator;