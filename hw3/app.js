// --- WebGL 2.0 Shaders ---
const VSHADER_SOURCE = `#version 300 es
in vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = 10.0; 
}`;

const FSHADER_SOURCE = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec4 u_color;
void main() {
    outColor = u_color;
}`;

let canvas, gl, program, vao, positionBuffer, u_colorLoc;
let state = 0; 
let circle = { cx: 0, cy: 0, r: 0 };
let lineSeg = { x1: 0, y1: 0, x2: 0, y2: 0 };
let tempEndPoint = null;
let intersections = [];

window.onload = () => {
    canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl2');
    initShaders();
    setupBuffers();
    setupMouseEvents();
    gl.clearColor(0.08, 0.16, 0.24, 1.0); // 비디오의 어두운 배경색
    drawScene();
};

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const a_position = gl.getAttribLocation(program, 'a_position');
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position);
}

function convertToWebGL(x, y) {
    const rect = canvas.getBoundingClientRect();
    return [((x - rect.left) / canvas.width) * 2 - 1, -(((y - rect.top) / canvas.height) * 2 - 1)];
}

function setupMouseEvents() {
    canvas.onmousedown = (e) => {
        const [glX, glY] = convertToWebGL(e.clientX, e.clientY);
        if (state === 0) { circle.cx = glX; circle.cy = glY; state = 1; }
        else if (state === 2) { lineSeg.x1 = glX; lineSeg.y1 = glY; state = 3; }
    };
    canvas.onmousemove = (e) => {
        const [glX, glY] = convertToWebGL(e.clientX, e.clientY);
        if (state === 1) {
            circle.r = Math.sqrt(Math.pow(glX - circle.cx, 2) + Math.pow(glY - circle.cy, 2));
            updateText(); drawScene();
        } else if (state === 3) {
            lineSeg.x2 = glX; lineSeg.y2 = glY;
            tempEndPoint = [glX, glY];
            updateText(); drawScene();
        }
    };
    canvas.onmouseup = () => {
        if (state === 1) state = 2;
        else if (state === 3) {
            state = 4; calculateIntersections();
            updateText(); drawScene();
        }
    };
}

function calculateIntersections() {
    intersections = [];
    const dx = lineSeg.x2 - lineSeg.x1, dy = lineSeg.y2 - lineSeg.y1;
    const fx = lineSeg.x1 - circle.cx, fy = lineSeg.y1 - circle.cy;
    const a = dx*dx + dy*dy, b = 2*(fx*dx + fy*dy), c = (fx*fx + fy*fy) - circle.r*circle.r;
    const det = b*b - 4*a*c;
    if (det >= 0) {
        const t1 = (-b - Math.sqrt(det)) / (2*a), t2 = (-b + Math.sqrt(det)) / (2*a);
        if (t1 >= 0 && t1 <= 1) intersections.push({x: lineSeg.x1 + t1*dx, y: lineSeg.y1 + t1*dy});
        if (det > 0 && t2 >= 0 && t2 <= 1) intersections.push({x: lineSeg.x1 + t2*dx, y: lineSeg.y1 + t2*dy});
    }
}

function updateText() {
    document.getElementById('info1').innerText = state >= 1 ? `Circle: center (${circle.cx.toFixed(2)}, ${circle.cy.toFixed(2)}) radius = ${circle.r.toFixed(2)}` : "";
    document.getElementById('info2').innerText = state >= 3 ? `Line segment: (${lineSeg.x1.toFixed(2)}, ${lineSeg.y1.toFixed(2)}) ~ (${lineSeg.x2.toFixed(2)}, ${lineSeg.y2.toFixed(2)})` : "";
    if (state === 4) {
        let txt = intersections.length === 0 ? "No intersection" : `Intersection Points: ${intersections.length}`;
        intersections.forEach((p, i) => txt += ` Point ${i+1}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`);
        document.getElementById('info3').innerText = txt;
    }
}

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    // 1. 축(Axes) 그리기
    gl.uniform4fv(u_colorLoc, [0.8, 0.2, 0.2, 1.0]); // X축 (빨간색)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 0, 1, 0]), gl.STATIC_DRAW);
    gl.drawArrays(gl.LINES, 0, 2);
    gl.uniform4fv(u_colorLoc, [0.2, 0.8, 0.4, 1.0]); // Y축 (초록색)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, -1, 0, 1]), gl.STATIC_DRAW);
    gl.drawArrays(gl.LINES, 0, 2);

    // 2. 원 그리기
    if (state >= 1) {
        let cv = [];
        for(let i=0; i<=100; i++) {
            let a = (i/100)*Math.PI*2;
            cv.push(circle.cx + circle.r*Math.cos(a), circle.cy + circle.r*Math.sin(a));
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cv), gl.STATIC_DRAW);
        // 드래그 중엔 흰색, 완료 후엔 보라색
        gl.uniform4fv(u_colorLoc, state === 1 ? [0.8, 0.8, 0.8, 1.0] : [1.0, 0.0, 1.0, 1.0]);
        gl.drawArrays(gl.LINE_STRIP, 0, 101);
    }

    // 3. 선분 그리기
    if (state >= 3) {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([lineSeg.x1, lineSeg.y1, lineSeg.x2, lineSeg.y2]), gl.STATIC_DRAW);
        gl.uniform4fv(u_colorLoc, [0.7, 0.8, 1.0, 1.0]); // 하늘색
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // 4. 교차점 그리기 (노란색 사각형)
    if (state === 4 && intersections.length > 0) {
        let pv = [];
        intersections.forEach(p => pv.push(p.x, p.y));
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pv), gl.STATIC_DRAW);
        gl.uniform4fv(u_colorLoc, [1.0, 1.0, 0.0, 1.0]); // 노란색
        gl.drawArrays(gl.POINTS, 0, intersections.length);
    }
}

function initShaders() {
    const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, VSHADER_SOURCE); gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, FSHADER_SOURCE); gl.compileShader(fs);
    program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    gl.useProgram(program);
    u_colorLoc = gl.getUniformLocation(program, 'u_color');
}