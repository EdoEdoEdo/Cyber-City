/**
 * Background Constants - Shared palette and shaders
 */

// Color palette
export const PALETTE = {
    SKY_TOP: '#050510',
    SKY_MID: '#0a0a1a',
    SKY_BOTTOM: '#101025',

    NEON_CYAN: '#00ffff',
    NEON_PINK: '#ff0080',
    NEON_PURPLE: '#aa00ff',
    NEON_ORANGE: '#ff6600',

    LED_GLOW: '#ff0066',
    HOLOGRAM_COLOR: '#00ffff',

    WINDOW_LIT: '#ffaa44',
};

// Holographic Vertex Shader
export const holographicVertexShader = `
uniform float uTime;
varying vec3 vPosition;
varying vec3 vNormal;

float random2D(vec2 value) {
    return fract(sin(dot(value.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
    float glitchTime = uTime - modelPosition.y;
    float glitchStrength = sin(glitchTime) + sin(glitchTime * 3.45) + sin(glitchTime * 8.76);
    glitchStrength /= 3.0;
    glitchStrength = smoothstep(0.3, 1.0, glitchStrength);
    glitchStrength *= 0.15;
    modelPosition.x += (random2D(modelPosition.xz + uTime) - 0.5) * glitchStrength;
    modelPosition.z += (random2D(modelPosition.zx + uTime) - 0.5) * glitchStrength;
    
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
    
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);
    vPosition = modelPosition.xyz;
    vNormal = modelNormal.xyz;
}
`;

// Holographic Fragment Shader
export const holographicFragmentShader = `
uniform vec3 uColor;
uniform float uTime;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    vec3 normal = normalize(vNormal);
    if(!gl_FrontFacing) normal *= -1.0;
    
    float stripes = mod((vPosition.y - uTime * 0.03) * 30.0, 1.0);
    stripes = pow(stripes, 3.0);
    
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    float fresnel = dot(viewDirection, normal) + 1.0;
    fresnel = pow(fresnel, 2.0);
    
    float falloff = smoothstep(0.8, 0.2, fresnel);
    
    float holographic = stripes * fresnel;
    holographic += fresnel * 1.25;
    holographic *= falloff;
    
    gl_FragColor = vec4(uColor, holographic);
}
`;
