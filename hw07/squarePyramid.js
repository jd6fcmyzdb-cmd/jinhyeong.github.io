export class SquarePyramid {
    constructor(gl, options = {}) {
        this.gl = gl;
        
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // 1. 정점 위치 (Homework 05와 동일)
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

        // 2. 법선 벡터 (기존 코드 유지)
        const ny = 0.4472135955;
        const nzx = 0.894427191;
        this.normals = new Float32Array([
            0, ny, nzx,    0, ny, nzx,    0, ny, nzx,
            nzx, ny, 0,    nzx, ny, 0,    nzx, ny, 0,
            0, ny, -nzx,   0, ny, -nzx,   0, ny, -nzx,
            -nzx, ny, 0,   -nzx, ny, 0,   -nzx, ny, 0,
            0, -1, 0,      0, -1, 0,      0, -1, 0,      0, -1, 0
        ]);

        // 3. 정점 색상 (기존 코드 유지)
        this.colors = new Float32Array(16 * 4);
        const faceColors = [[1, 0, 0, 1], [1, 1, 0, 1], [1, 0, 1, 1], [0, 1, 1, 1], [0, 0, 1, 1]];
        for(let i=0; i<3; i++) this.colors.set(faceColors[0], i*4);
        for(let i=0; i<3; i++) this.colors.set(faceColors[1], (3+i)*4);
        for(let i=0; i<3; i++) this.colors.set(faceColors[2], (6+i)*4);
        for(let i=0; i<3; i++) this.colors.set(faceColors[3], (9+i)*4);
        for(let i=0; i<4; i++) this.colors.set(faceColors[4], (12+i)*4);

        // 4. 텍스처 좌표 (수정 포인트: 옆면 래핑)[cite: 1]
        // 옆면 4개가 이미지 하나를 나누어 쓰도록 0.25 단위로 배치
        this.texCoords = new Float32Array([
            // Front: u[0.0 ~ 0.25], Apex는 중간인 0.125
            0.0, 0.0,  0.25, 0.0,  0.125, 1.0,
            // Right: u[0.25 ~ 0.5], Apex는 중간인 0.375
            0.25, 0.0, 0.5, 0.0,   0.375, 1.0,
            // Back:  u[0.5 ~ 0.75], Apex는 중간인 0.625
            0.5, 0.0,  0.75, 0.0,  0.625, 1.0,
            // Left:  u[0.75 ~ 1.0], Apex는 중간인 0.875
            0.75, 0.0, 1.0, 0.0,   0.875, 1.0,
            // Bottom: 이미지 전체 매핑 (0~1)[cite: 1]
            0, 1,  0, 0,  1, 0,  1, 1 
        ]);

        // 5. 인덱스 버퍼 (기존 코드 유지)
        this.indices = new Uint16Array([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 14, 15, 12
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
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); // pos
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize); // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize); // color
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize); // tex
        for (let i = 0; i <= 3; i++) gl.enableVertexAttribArray(i);
        gl.bindVertexArray(null);
    }

    draw(shader) {
        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, 18, this.gl.UNSIGNED_SHORT, 0);
    }
}