#version 300 es

precision highp float;

out vec4 FragColor;
in vec3 fragPos;  
in vec3 normal;  
// in vec2 texCoord; // 텍스처 좌표는 더 이상 사용하지 않습니다.

struct Material {
    vec3 diffuse;      // sampler2D 대신 단색(vec3)으로 변경
    vec3 specular;     // 표면의 specular color
    float shininess;   // specular 반짝임 정도
};

struct Light {
    vec3 direction;
    vec3 ambient; 
    vec3 diffuse; 
    vec3 specular; 
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;
uniform float u_toonLevels; 

void main() {
    // 텍스처 대신 material.diffuse 색상을 기본 색상으로 사용합니다.
    vec3 baseColor = material.diffuse;

    // ambient
    vec3 ambient = light.ambient * baseColor;
    
    // diffuse 
    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(light.direction);
    float dotNormLight = dot(norm, lightDir);
    float diff = max(dotNormLight, 0.0);
    
    // [Toon Shading] Diffuse 양자화
    diff = (floor(diff * u_toonLevels) ) / u_toonLevels;
    diff = clamp(diff, 0.0, 1.0);
    
    vec3 diffuse = light.diffuse * diff * baseColor;  
    
    // specular
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = 0.0;
    if (dotNormLight > 0.0) {
        spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
        
        // [Toon Shading] Specular 양자화
        spec = (floor(spec * u_toonLevels) ) / u_toonLevels;
        spec = clamp(spec, 0.0, 1.0);
    }
    vec3 specular = light.specular * spec * material.specular;  
        
    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
}