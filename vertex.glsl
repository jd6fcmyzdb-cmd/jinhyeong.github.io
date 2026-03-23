#version 300 es
layout(location = 0) in vec2 aPos;
uniform vec2 u_offset; // 4) JS에서 넘겨받을 이동 좌표

void main() {
    // 4) 원래 정점 위치에 offset을 더해 이동 처리
    gl_Position = vec4(aPos + u_offset, 0.0, 1.0);
}