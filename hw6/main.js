import { Cube } from './util/cube.js';

const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl2');

// 1. PDF 이미지와 동일한 초기 카메라 상태 설정 (4번 항목)
let cameraPos = glMatrix.vec3.fromValues(-0.8, -0.0, 11.1);
let yaw = -89.5;
let pitch = 1.2;

let cameraFront = glMatrix.vec3.create();
let cameraUp = glMatrix.vec3.fromValues(0, 1, 0);
let isLocked = false;
const keys = {};

// 2. 5개의 큐브 위치 (6번 항목)
const cubePositions = [
    [0.0, 0.0, 0.0],      // 0
    [2.0, 0.5, -3.0],     // 1
    [-1.5, -0.5, -2.5],   // 2
    [3.0, 0.0, -4.0],     // 3
    [-3.0, 0.0, 1.0]      // 4
];

// 3. 사진과 비슷한 길이(5.0)의 XYZ 좌표축 VAO 생성
function createAxesVAO(gl) {
    const len = 5.0; // 축의 길이를 10.0에서 5.0으로 조정
    const vertices = new Float32Array([
        // X축 (Red)
        -len, 0.0, 0.0,  1, 0, 0, 1,
         len, 0.0, 0.0,  1, 0, 0, 1,
        // Y축 (Green)
        0.0, -len, 0.0,  0, 1, 0, 1,
        0.0,  len, 0.0,  0, 1, 0, 1,
        // Z축 (Blue)
        0.0, 0.0, -len,  0, 0, 1, 1,
        0.0, 0.0,  len,  0, 0, 1, 1
    ]);

    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 7 * 4, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 7 * 4, 3 * 4);
    gl.enableVertexAttribArray(2);

    gl.bindVertexArray(null);
    return vao;
}

async function init() {
    const program = await createProgram();
    const cube = new Cube(gl);
    const axesVAO = createAxesVAO(gl);

    const uModelLoc = gl.getUniformLocation(program, "uModel");
    const uViewLoc = gl.getUniformLocation(program, "uView");
    const uProjLoc = gl.getUniformLocation(program, "uProjection");

    function render() {
        updateCameraVectors();
        processInput();
        updateUI();

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.SCISSOR_TEST);

        const drawScene = (projMat, viewMat) => {
            gl.useProgram(program);
            gl.uniformMatrix4fv(uProjLoc, false, projMat);
            gl.uniformMatrix4fv(uViewLoc, false, viewMat);

            // 1. 축 그리기
            gl.uniformMatrix4fv(uModelLoc, false, glMatrix.mat4.create());
            gl.bindVertexArray(axesVAO);
            gl.drawArrays(gl.LINES, 0, 6);

            // 2. 큐브 그리기 (각각 독립적인 model matrix 사용) [cite: 13]
            cubePositions.forEach(pos => {
                const model = glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), pos);
                gl.uniformMatrix4fv(uModelLoc, false, model);
                cube.draw({ use: () => gl.useProgram(program) });
            });
        };

        // 4. 왼쪽 Viewport: Perspective (Background: 0.1, 0.2, 0.3) [cite: 11, 12, 19]
        gl.viewport(0, 0, 700, 700);
        gl.scissor(0, 0, 700, 700);
        gl.clearColor(0.1, 0.2, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const projP = glMatrix.mat4.perspective(glMatrix.mat4.create(), glMatrix.glMatrix.toRadian(60), 1.0, 0.1, 100.0);
        const viewP = glMatrix.mat4.lookAt(glMatrix.mat4.create(), cameraPos, glMatrix.vec3.add(glMatrix.vec3.create(), cameraPos, cameraFront), cameraUp);
        drawScene(projP, viewP);

        // 5. 오른쪽 Viewport: Orthographic Top-down (Background: 0.05, 0.15, 0.2) [cite: 11, 12, 20]
        gl.viewport(700, 0, 700, 700);
        gl.scissor(700, 0, 700, 700);
        gl.clearColor(0.05, 0.15, 0.2, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const projO = glMatrix.mat4.ortho(glMatrix.mat4.create(), -10, 10, -10, 10, 0.1, 100.0);
        const viewO = glMatrix.mat4.lookAt(glMatrix.mat4.create(), [0, 15, 0], [0, 0, 0], [0, 0, -1]);
        drawScene(projO, viewO);

        requestAnimationFrame(render);
    }
    render();
}

function updateCameraVectors() {
    let front = glMatrix.vec3.create();
    front[0] = Math.cos(glMatrix.glMatrix.toRadian(yaw)) * Math.cos(glMatrix.glMatrix.toRadian(pitch));
    front[1] = Math.sin(glMatrix.glMatrix.toRadian(pitch));
    front[2] = Math.sin(glMatrix.glMatrix.toRadian(yaw)) * Math.cos(glMatrix.glMatrix.toRadian(pitch));
    glMatrix.vec3.normalize(cameraFront, front);
}

// 9) 'setupText' / 'updateText' 정보 업데이트 [cite: 21, 23, 24, 25]
function updateUI() {
    document.getElementById('line1').innerText = `Camera pos: (${cameraPos[0].toFixed(1)}, ${cameraPos[1].toFixed(1)}, ${cameraPos[2].toFixed(1)}) | Yaw: ${yaw.toFixed(1)}° | Pitch: ${pitch.toFixed(1)}°`;
    document.getElementById('line2').innerText = `WASD: move camera | Mouse: look (click to lock) | ESC: unlock`;
    document.getElementById('line3').innerText = `Left: Perspective (FP) Right: Orthographic (Top-Down)`;
}

function processInput() {
    const speed = 0.1;
    if (keys['w']) glMatrix.vec3.scaleAndAdd(cameraPos, cameraPos, cameraFront, speed);
    if (keys['s']) glMatrix.vec3.scaleAndAdd(cameraPos, cameraPos, cameraFront, -speed);
    const right = glMatrix.vec3.cross(glMatrix.vec3.create(), cameraFront, cameraUp);
    glMatrix.vec3.normalize(right, right);
    if (keys['a']) glMatrix.vec3.scaleAndAdd(cameraPos, cameraPos, right, -speed);
    if (keys['d']) glMatrix.vec3.scaleAndAdd(cameraPos, cameraPos, right, speed);
}

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('click', () => canvas.requestPointerLock());
document.addEventListener('pointerlockchange', () => isLocked = document.pointerLockElement === canvas);
document.addEventListener('mousemove', e => {
    if (!isLocked) return;
    yaw += e.movementX * 0.1;
    pitch -= e.movementY * 0.1;
    pitch = Math.max(-89.0, Math.min(89.0, pitch));
});

async function createProgram() {
    const vsSource = `#version 300 es
        layout(location=0) in vec3 aPos;
        layout(location=2) in vec4 aCol;
        uniform mat4 uModel, uView, uProjection;
        out vec4 vCol;
        void main() {
            gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);
            vCol = aCol;
        }`;
    const fsSource = `#version 300 es
        precision mediump float;
        in vec4 vCol;
        out vec4 fCol;
        void main() { fCol = vCol; }`;
    
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    return prog;
}

init();