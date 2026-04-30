/*-----------------------------------------------------------------------------------
Homework 07: Square Pyramid with Wrapped Texture (sunrise.jpg)
-----------------------------------------------------------------------------------*/
import { resizeAspectRatio, Axes } from './util/util.js';
import { Shader, readShaderFile } from './util/shader.js';
import { SquarePyramid } from './squarePyramid.js'; // 같은 폴더에서 로드
import { Arcball } from './util/arcball.js';
import { loadTexture } from './util/texture.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader, pyramid, texture;
let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();

// Arcball 및 축 설정
const arcball = new Arcball(canvas, 5.0, { rotation: 2.0, zoom: 0.0005 });
const axes = new Axes(gl, 1.5);

async function main() {
    if (!gl) return;

    // 조건 1: 캔버스 크기 700x700
    canvas.width = 700;
    canvas.height = 700;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // 쉐이더 및 오브젝트 초기화
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
    
    pyramid = new SquarePyramid(gl);
    // 텍스처 이미지 로드: sunrise.jpg
    texture = loadTexture(gl, true, './sunrise.jpg'); 

    // 초기 카메라/투영 설정
    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -3));
    mat4.perspective(projMatrix, glMatrix.toRadian(60), 1, 0.1, 1000.0);

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    viewMatrix = arcball.getViewMatrix();

    shader.use();
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projMatrix);

    // 텍스처 바인딩
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    shader.setInt('u_texture', 0);

    pyramid.draw(shader);
    axes.draw(viewMatrix, projMatrix);

    requestAnimationFrame(render);
}

document.addEventListener('DOMContentLoaded', main);