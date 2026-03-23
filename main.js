async function main() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2');

    if (!gl) return alert("WebGL 2를 지원하지 않는 브라우저입니다.");

    // 1) 처음 실행 시 캔버스 크기 600x600 [cite: 6]
    canvas.width = 600;
    canvas.height = 600;

    // 8) 1:1 비율을 항상 유지하는 유틸리티 함수 
    function resizeAspectRatio() {
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;
        const size = Math.min(displayWidth, displayHeight);

        // 실제 캔버스의 스타일 크기 조절 (비율 유지)
        canvas.style.width = size + "px";
        canvas.style.height = size + "px";

        // WebGL 뷰포트를 정사각형으로 고정
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resizeAspectRatio);
    resizeAspectRatio();

    // 6) 셰이더를 독립 파일로 읽어들임 
    const [vsSource, fsSource] = await Promise.all([
        fetch('vertex.glsl').then(res => res.text()),
        fetch('fragment.glsl').then(res => res.text())
    ]);

    // 셰이더 컴파일 및 프로그램 생성 로직
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    // 2) 한 변의 길이가 0.2인 정사각형 데이터 (중앙 위치) [cite: 7]
    const s = 0.1; // 중심에서 각 변까지의 거리
    const vertices = new Float32Array([
        -s,  s, // 왼위
        -s, -s, // 왼아
         s, -s, // 오아
         s,  s  // 오위
    ]);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const offsetLoc = gl.getUniformLocation(program, "u_offset");
    let posX = 0.0, posY = 0.0;

    // 3) 화살표 키 이벤트 및 이동 제한 [cite: 8, 20-31]
    window.addEventListener('keydown', (e) => {
        const step = 0.01; // 이동 단위 [cite: 8]
        // 2) & 3) 사각형이 캔버스 밖으로 나가지 않도록 제한 [cite: 2, 3]
        // NDC 범위(-1.0 ~ 1.0)에서 사각형 반지름(0.1)을 뺀 0.9가 한계치임
        if (e.key === 'ArrowUp' && posY + s < 1.0) posY += step;
        if (e.key === 'ArrowDown' && posY - s > -1.0) posY -= step;
        if (e.key === 'ArrowLeft' && posX - s > -1.0) posX -= step;
        if (e.key === 'ArrowRight' && posX + s < 1.0) posX += step;
    });

    function render() {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        gl.uniform2f(offsetLoc, posX, posY); // 4) uniform 변수 업데이트 [cite: 9]
        gl.bindVertexArray(vao);

        // 5) index 없이 TRIANGLE_FAN으로 그리기 [cite: 10]
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

        requestAnimationFrame(render);
    }
    render();
}

main();