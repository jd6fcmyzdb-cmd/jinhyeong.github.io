/*-------------------------------------------------------------------------
Homework05.js

- Viewing a 3D Square Pyramid at origin with perspective projection
- The pyramid is stationary (no rotation)
- A camera is rotating around the origin through the circle of radius 3
- The height (y position) of the camera moves repeatedly between 0 and 10
- The camera is always looking at the origin.
---------------------------------------------------------------------------*/

import { resizeAspectRatio, Axes } from './util/util.js';
import { Shader, readShaderFile } from './util/shader.js';

// 조건 7: 사각뿔 라이브러리는 현재(Homework05) 폴더에서 임포트 [cite: 9, 11]
import { SquarePyramid } from './squarePyramid.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let startTime;
let lastFrameTime;

let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create(); 

// 조건 4 & 5: 카메라 이동 파라미터 
const cameraCircleRadius = 3.0; 
const cameraCircleSpeed = 90.0;    // x, z축 원형 이동 속도 (90 deg/sec) [cite: 7]
const cameraVerticalSpeed = 45.0;  // y축 수직 이동 속도 (45 deg/sec) [cite: 7]

let pyramid;
let axes;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('program terminated');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('program terminated with error:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    // 조건 1: 처음 실행 시 캔버스 크기를 700 x 700으로 고정 
    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // 첨부된 영상과 비슷한 어두운 남색 계열로 배경색 설정
    gl.clearColor(0.12, 0.16, 0.24, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000.0; // convert to second

    lastFrameTime = currentTime;

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // 조건 6: 사각뿔은 제자리에 고정되며 회전하지 않음 [cite: 8]
    // modelMatrix는 항등행렬(Identity Matrix) 상태를 유지합니다.

    // 조건 4 & 5: 카메라 위치 계산 
    // x와 z는 90 deg/sec로 반경 3인 원을 그림 
    let camX = cameraCircleRadius * Math.sin(glMatrix.toRadian(cameraCircleSpeed * elapsedTime));
    let camZ = cameraCircleRadius * Math.cos(glMatrix.toRadian(cameraCircleSpeed * elapsedTime));
    
    // y는 45 deg/sec 속도로 0부터 10까지 반복 
    // Math.sin은 -1 ~ 1을 반환하므로, 범위 조정을 위해 5 + 5 * sin() 사용 [cite: 6]
    let camY = 5.0 + 5.0 * Math.sin(glMatrix.toRadian(cameraVerticalSpeed * elapsedTime));

    // Viewing transformation matrix
    mat4.lookAt(viewMatrix, 
        vec3.fromValues(camX, camY, camZ), // camera position
        vec3.fromValues(0, 0, 0),          // look at origin (사각뿔의 중심 좌표)
        vec3.fromValues(0, 1, 0)           // up vector
    );

    // 사각뿔 렌더링
    shader.use();
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projMatrix);
    pyramid.draw(shader);

    // 좌표축 렌더링
    axes.draw(viewMatrix, projMatrix);

    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL initialization failed');
        }
        
        await initShader();

        // 큐브 대신 사각뿔(Square Pyramid) 인스턴스 생성 [cite: 2]
        pyramid = new SquarePyramid(gl);
        axes = new Axes(gl, 1.8);

        // Projection transformation matrix
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),        // field of view (fov, degree)
            canvas.width / canvas.height, // aspect ratio
            0.1,                          // near
            100.0                         // far
        );

        // starting time (global variable) for animation
        startTime = lastFrameTime = Date.now();

        // call the render function the first time for animation
        requestAnimationFrame(render);

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}