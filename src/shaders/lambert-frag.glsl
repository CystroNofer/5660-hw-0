#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

uniform vec4 u_Color; // The color with which to render this instance of geometry.

uniform float u_AbsorptionStrength;
uniform float u_ForwardScatteringDensing;
uniform int u_Step;

uniform highp sampler3D u_Tex;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_PosWS;
in vec3 fs_viewDirWS;
// in vec3 fs_LightDirWS;
in vec4 fs_Col;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

const vec3 lightPosWS = vec3(5, 5, 3);

// const int STEPS = 80;

bool insideCube(vec3 p)
{
    return all(greaterThanEqual(p, vec3(0.0))) &&
           all(lessThanEqual(p, vec3(1.0)));
}

float getDensity(vec3 uv)
{
    return smoothstep(0.6, 0.7, texture(u_Tex, uv).r);
}

void main()
{
    float stepSize = 1.732 / float(u_Step); // sqrt(3) / steps
    
    vec3 rayDir = normalize(-fs_viewDirWS);
    vec3 posUVWS = (fs_PosWS.xyz + 1.0) / 2.0;

    vec3 p = posUVWS;

    float transmittance = 1.0;
    vec3 accumulatedLight = vec3(0.0);

    for (int i = 0; i < u_Step; ++i)
    {
        if (!insideCube(p))
            break;

        vec3 lightDir = normalize(lightPosWS - p * 2.0 - 1.0);
        float forwardScattering = 0.4 + 0.6 * pow(max(dot(rayDir, lightDir), 0.0), u_ForwardScatteringDensing);

        float lighting = exp(-(getDensity(p) * stepSize * u_AbsorptionStrength));

        accumulatedLight +=
            vec3(forwardScattering * (1.0 - lighting) * transmittance);

        transmittance *= lighting;

        if (transmittance < 0.01)
            break;

        p += rayDir * stepSize;
    }

    float alpha = 1.0 - transmittance;

    out_Col = vec4(accumulatedLight * u_Color.rgb, alpha);
    // out_Col = vec4(vec3(getDensity(posUVWS)), 1);
}
