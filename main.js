// 외부 셰이더 파일을 비동기로 읽어오는 함수
async function loadShader(url) {
    const response = await fetch(url);
    return await response.text();
}

async function main() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2');

    // 1) 처음 실행 시 캔버스 크기 600x600 설정
    canvas.width = 600;
    canvas.height = 600;

    // 8) resizeAspectRatio() 유틸리티 함수: 1:1 비율 유지
    function resizeAspectRatio() {
        const minSize = Math.min(window.innerWidth, window.innerHeight);
        canvas.style.width = minSize + 'px';
        canvas.style.height = minSize + 'px';
    }
    window.addEventListener('resize', resizeAspectRatio);
    resizeAspectRatio(); // 초기 실행 시 적용

    // 6) 셰이더 독립 파일로 읽어오기
    const vsSource = await loadShader('vertex.glsl');
    const fsSource = await loadShader('fragment.glsl');

    // 셰이더 컴파일 및 프로그램 생성
    function compileShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }
    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // 2) 한 변의 길이가 0.2인 정사각형 (중앙 기준 -0.1 ~ 0.1)
    // 5) TRIANGLE_FAN 사용을 위해 순서대로 꼭짓점 4개 나열
    const vertices = new Float32Array([
        -0.1,  0.1,  // 왼쪽 위
        -0.1, -0.1,  // 왼쪽 아래
         0.1, -0.1,  // 오른쪽 아래
         0.1,  0.1   // 오른쪽 위
    ]);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const offsetLoc = gl.getUniformLocation(program, 'u_offset');

    // 초기 위치 (중앙)
    let posX = 0.0;
    let posY = 0.0;
    const step = 0.01; // 3) 이동 단위

    // HINT 활용: 키보드 이벤트 리스너
    window.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown' ||
            event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            
            // 3) 방향에 따라 +0.01 또는 -0.01 이동
            if (event.key === 'ArrowUp') posY += step;
            if (event.key === 'ArrowDown') posY -= step;
            if (event.key === 'ArrowLeft') posX -= step;
            if (event.key === 'ArrowRight') posX += step;

            // 이동 범위 제한 로직: 캔버스 밖으로 부분적으로도 나가지 않도록 방지
            // NDC 좌표는 -1.0 ~ 1.0 이고, 사각형 중심에서 끝까지 거리가 0.1이므로 최대 한계는 0.9 / -0.9
            if (posX > 0.9) posX = 0.9;
            if (posX < -0.9) posX = -0.9;
            if (posY > 0.9) posY = 0.9;
            if (posY < -0.9) posY = -0.9;
        }
    });

    function render() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        
        // 4) 업데이트된 좌표를 uniform으로 전달
        gl.uniform2f(offsetLoc, posX, posY);

        gl.bindVertexArray(vao);
        
        // 5) index를 사용하지 않고 drawArrays 및 TRIANGLE_FAN 사용
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

        requestAnimationFrame(render);
    }

    render();
}

main().catch(console.error);