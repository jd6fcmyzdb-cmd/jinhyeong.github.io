#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec4 a_color;
layout(location = 3) in vec2 a_texCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec4 v_color;
out vec2 v_texCoord;

void main() {
    // 투영 * 뷰 * 모델 행렬을 적용하여 정점 위치 계산
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
    
    // 프래그먼트 쉐이더로 색상 및 텍스처 좌표 전달
    v_color = a_color;
    v_texCoord = a_texCoord;
}