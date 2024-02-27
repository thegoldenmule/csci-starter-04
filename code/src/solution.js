
import geo from "./geo.js";
import { create } from "./node.js";
import { loadShader } from "./shaders.js";
import { loadTextureAsync } from "./textures.js";

/** @type {WebGLRenderingContext} */
let gl;

const { mat4, vec3, quat } = glMatrix;
const clearColor = {
  r: 25/255,
  g: 25/255,
  b: 25/255,
};
const programs = {};
const scene = [];

window.init = async (canvas) => {
  // context
  gl = canvas.getContext('webgl2');
  gl.clearColor(clearColor.r, clearColor.g, clearColor.b, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // shaders
  programs.default = await loadShader(gl, {
    //
  });

  const plane = create(gl, {
    program: programs.default,
    ...geo.quad(),
    rotation: quat.fromEuler(quat.create(), -90, 0, 0),
    scale: vec3.fromValues(1, 1, 1),
    attributes: [
      { key: 'diffuse', name: 'aTextureCoord' },
    ],
  });

  const texture = await loadTextureAsync(gl,
  {
    path: 'assets/texture.png',
  });
  console.log('Loaded!');

  plane.textures.diffuse = texture;

  scene.push(plane);
};

window.loop = (dt, canvas) => {
  const { width, height } = canvas;

  // clear
  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // setup matrices
  const P = mat4.perspective(mat4.create(),
    45 * (Math.PI / 180),
    width / height,
    0.1, 10000);

  const V = mat4.identity(mat4.create());
  mat4.translate(V, V, [0, 0, -3]);
  mat4.rotateX(V, V, 0.05 * Math.PI);

  // draw roots
  for (const node of scene) {
    drawGraph(node, null, dt, P, V);
  }
};

const drawGraph = (node, parent, dt, P, V) => {
  const { program, update, draw, children, } = node;
  if (update) {
    update(dt);
  }

  if (program) {
    const { uniforms, } = program;
    gl.useProgram(program);
    {
      gl.uniformMatrix4fv(uniforms.P, false, P);

      draw({ program, parent, V });
    }
  }

  // draw children
  for (const child of children) {
    drawGraph(child, node, dt, P, V);
  }
};
