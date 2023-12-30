import * as THREE from 'three';

class MeshGenerator {
  
  generateTerrainMesh (heightMap = []) {
    const width = heightMap.length;
    const height = heightMap[0].length;

    const topLeftX = (width - 1) / -2; 
    const topLeftZ = (width - 1) / 2; 

    let meshData = new MeshData(width, height);
    let vertexIndex = 0;

    let verts = [];
    let uvs = [];

    for (let x = 0; x < width; x++) {
      
      for (let y = 0; y < height; y++) {
        
        const vx = parseFloat(topLeftX + x);
        const vy = parseFloat(heightMap[y][x]);
        const vz = parseFloat(topLeftZ - y);

        meshData.addVertex(vertexIndex, new THREE.Vector3(vx, vy, vz));
        meshData.addUv(vertexIndex, new THREE.Vector2(x / width, y / height));

        if (x < width - 1 && y < height - 1) {
          meshData.addTriangle(vertexIndex, vertexIndex + width + 1, vertexIndex + width)
          meshData.addTriangle(vertexIndex + width + 1, vertexIndex,  vertexIndex + 1)
        }

        vertexIndex++;
      }
      
    }

    // meshData.vertices = new Float32Array(verts);
    // meshData.uvs = new Float32Array(uvs);

    return meshData;
  }

  TextureFromColourMap(colourMap = [], width, height) {
		const texture = new THREE.Texture(width, height);
		// texture.filterMode = FilterMode.Point;
		// texture.wrapMode = TextureWrapMode.Clamp;
    texture.
		texture.SetPixels (colourMap);
		texture.Apply ();
		return texture;
	}
}

class MeshData {
  constructor(meshWidth, meshHeight){
    this.triangleIndex;
    this.vertices = new Float32Array(meshWidth * meshHeight);
    this.triangles = new Float32Array((meshWidth-1)*(meshHeight-1)*6)  
    this.uvs = new Float32Array(meshWidth * meshHeight)  
    // this.vertices = []
    // this.triangles = [];
    // this.uvs = []
  }

  addUv(vertexIndex, uv) {
    this.uvs[vertexIndex] = uv;
  }

  addVertex(vertexIndex, vertex) {
    this.vertices[vertexIndex] = vertex;
  }

  addTriangle(a, b, c) {
    this.triangles[this.triangleIndex] = a;
    this.triangles[this.triangleIndex + 1] = b;
    this.triangles[this.triangleIndex+2] = c;
    this.triangleIndex += 3;
  }

  createMesh() {
    console.log({vertices: this.vertices})
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.BufferAttribute( this.vertices, 3 ));
    geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2))
    geometry.setIndex(this.triangles);
    geometry.computeVertexNormals();

    const material = new THREE.MeshBasicMaterial( { color: "#FFF" } );
    const mesh = new THREE.Mesh( geometry, material );
    return mesh;
  }
}

export default MeshGenerator;