#version 300 es
precision mediump float;

in vec4 v_color;
in vec2 v_texCoord;

out vec4 fragColor;

void main() {
    // 정점에서 넘어온 색상을 그대로 사용 (Flat Shading 데이터가 이미 colors 배열에 반영됨)
    fragColor = v_color;
}