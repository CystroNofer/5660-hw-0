import {vec3, vec4, mat4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifView: WebGLUniformLocation;
  unifProj: WebGLUniformLocation;
  // unifViewProj: WebGLUniformLocation;
  unifCamPos: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifDistortion: WebGLUniformLocation;

  unifColor: WebGLUniformLocation;
  unifAbsorptionStrength: WebGLUniformLocation;
  unifForwardScatteringDensing: WebGLUniformLocation;
  unifStep: WebGLUniformLocation;
  unifTex: WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");

    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifView = gl.getUniformLocation(this.prog, "u_View");
    this.unifProj = gl.getUniformLocation(this.prog, "u_Proj");
    // this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifCamPos   = gl.getUniformLocation(this.prog, "u_CamPos");
    this.unifTime      = gl.getUniformLocation(this.prog, "u_Time");
    this.unifDistortion      = gl.getUniformLocation(this.prog, "u_Distortion");
    
    this.unifColor      = gl.getUniformLocation(this.prog, "u_Color");
    this.unifAbsorptionStrength      = gl.getUniformLocation(this.prog, "u_AbsorptionStrength");
    this.unifForwardScatteringDensing      = gl.getUniformLocation(this.prog, "u_ForwardScatteringDensing");
    this.unifStep      = gl.getUniformLocation(this.prog, "u_Step");
    this.unifTex      = gl.getUniformLocation(this.prog, "u_Tex");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  // setViewProjMatrix(vp: mat4) {
  //   this.use();
  //   if (this.unifViewProj !== -1) {
  //     gl.uniformMatrix4fv(this.unifViewProj, false, vp);
  //   }
  // }

  setViewMatrix(vp: mat4) {
    this.use();
    if (this.unifView !== -1) {
      gl.uniformMatrix4fv(this.unifView, false, vp);
    }
  }

  setProjMatrix(vp: mat4) {
    this.use();
    if (this.unifProj !== -1) {
      gl.uniformMatrix4fv(this.unifProj, false, vp);
    }
  }

  setCamPos(cp: vec3) {
    this.use();
    if (this.unifCamPos !== -1) {
      gl.uniform3fv(this.unifCamPos, cp);
    }
  }

  setTime(time: number) {
    this.use();
    if (this.unifTime !== -1) {
      gl.uniform1f(this.unifTime, time);
    }
  }

  setDistortion(distortion: number) {
    this.use();
    if (this.unifDistortion !== -1) {
      gl.uniform1f(this.unifDistortion, distortion);
    }
  }

  setGeometryColor(color: vec4) {
    this.use();
    if (this.unifColor !== -1) {
      gl.uniform4fv(this.unifColor, color);
    }
  }

  setCloudProperties(abosorptionStrength: number, forwardScatteringDensity: number, step: number) {
    this.use();
    if (this.unifAbsorptionStrength !== -1) {
      gl.uniform1f(this.unifAbsorptionStrength, abosorptionStrength);
    }
    if (this.unifForwardScatteringDensing !== -1) {
      gl.uniform1f(this.unifForwardScatteringDensing, forwardScatteringDensity);
    }
    if (this.unifStep !== -1) {
      gl.uniform1i(this.unifStep, step);
    }
  }

  setTexture(tex: WebGLTexture) {
    this.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, tex);
    if (this.unifTex !== -1) {
      gl.uniform1i(this.unifTex, 0);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
  }
};

export default ShaderProgram;
