export class SquarePyramid {
    constructor(gl, options = {}) {
        this.gl = gl;
        
        // VAO 및 버퍼 생성
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // 1. 정점 위치 (총 16개 정점: 측면 4개 면 * 3 + 밑면 4)
        // 밑면 중심(0,0,0), dx=1, dz=1 이므로 밑면 모서리는 ±0.5
        // 꼭지점(Apex)은 (0, 1, 0)
        this.vertices = new Float32Array([
            // Front face (Front-Left, Front-Right, Apex)
            -0.5, 0, 0.5,    0.5, 0, 0.5,    0, 1, 0,
            // Right face (Front-Right, Back-Right, Apex)
             0.5, 0, 0.5,    0.5, 0, -0.5,   0, 1, 0,
            // Back face (Back-Right, Back-Left, Apex)
             0.5, 0, -0.5,  -0.5, 0, -0.5,   0, 1, 0,
            // Left face (Back-Left, Front-Left, Apex)
            -0.5, 0, -0.5,  -0.5, 0, 0.5,    0, 1, 0,
            // Bottom face (Front-Left, Back-Left, Back-Right, Front-Right)
            -0.5, 0, 0.5,   -0.5, 0, -0.5,   0.5, 0, -0.5,   0.5, 0, 0.5
        ]);

        // 2. 법선 벡터 (평면 기반 Flat Shading)
        // 빗면의 법선 벡터 계산: y축 기울기가 있으므로 정규화 필요
        const ny = 0.4472135955;  // 0.5 / sqrt(1.25)
        const nzx = 0.894427191;  // 1.0 / sqrt(1.25)

        this.normals = new Float32Array([
            // Front
            0, ny, nzx,    0, ny, nzx,    0, ny, nzx,
            // Right
            nzx, ny, 0,    nzx, ny, 0,    nzx, ny, 0,
            // Back
            0, ny, -nzx,   0, ny, -nzx,   0, ny, -nzx,
            // Left
            -nzx, ny, 0,  -nzx, ny, 0,   -nzx, ny, 0,
            // Bottom (아래를 향함)
            0, -1, 0,      0, -1, 0,      0, -1, 0,      0, -1, 0
        ]);

        // 3. 정점 색상
        this.colors = new Float32Array(16 * 4);
        if (options.color) {
            for (let i = 0; i < 16; i++) {
                this.colors.set(options.color, i * 4);
            }
        } else {
            const faceColors = [
                [1, 0, 0, 1], // Front: Red
                [1, 1, 0, 1], // Right: Yellow
                [1, 0, 1, 1], // Back: Magenta
                [0, 1, 1, 1], // Left: Cyan
                [0, 0, 1, 1]  // Bottom: Blue
            ];
            
            for(let i=0; i<3; i++) this.colors.set(faceColors[0], i*4);       // Front
            for(let i=0; i<3; i++) this.colors.set(faceColors[1], (3+i)*4);   // Right
            for(let i=0; i<3; i++) this.colors.set(faceColors[2], (6+i)*4);   // Back
            for(let i=0; i<3; i++) this.colors.set(faceColors[3], (9+i)*4);   // Left
            for(let i=0; i<4; i++) this.colors.set(faceColors[4], (12+i)*4);  // Bottom
        }

        // 4. 텍스처 좌표 (필요 시 사용할 수 있도록 매핑)
        this.texCoords = new Float32Array([
            0, 0,  1, 0,  0.5, 1, // Front
            0, 0,  1, 0,  0.5, 1, // Right
            0, 0,  1, 0,  0.5, 1, // Back
            0, 0,  1, 0,  0.5, 1, // Left
            0, 1,  0, 0,  1, 0,  1, 1 // Bottom
        ]);

        // 5. 인덱스 버퍼 (총 6개의 삼각형, 18개 인덱스)
        this.indices = new Uint16Array([
            0, 1, 2,      // Front
            3, 4, 5,      // Right
            6, 7, 8,      // Back
            9, 10, 11,    // Left
            12, 13, 14,   14, 15, 12 // Bottom
        ]);

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + nSize + cSize + tSize;

        gl.bindVertexArray(this.vao);

        // VBO 데이터 할당
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

        // EBO 데이터 할당
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // 정점 속성 포인터 설정
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);                 // position
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize);             // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize);     // color
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize); // texCoord

        for (let i = 0; i <= 3; i++) gl.enableVertexAttribArray(i);

        // 바인딩 해제
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        // 사각뿔은 총 18개의 인덱스로 그려짐
        gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        this.gl.deleteBuffer(this.vbo);
        this.gl.deleteBuffer(this.ebo);
        this.gl.deleteVertexArray(this.vao);
    }
}