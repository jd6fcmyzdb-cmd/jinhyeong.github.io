#version 300 es

layout(location = 0) in vec3 aPos;
layout(location = 2) in vec4 aColor; // cube.js의 color attribute location은 2

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec4 vColor;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);
    vColor = aColor;
}