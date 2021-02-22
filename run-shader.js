'use strict';

const HSBToRGB = (h, s, b) => {
    s /= 100;
    b /= 100;
    const k = (n) => (n + h / 60) % 6;
    const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    return [f(5), f(3),  f(1)];
};

const init = function() {
    var dpp = window.devicePixelRatio || 1;
    var canvas = document.querySelector("canvas");
    var width = window.innerWidth * dpp;
    var height = window.innerHeight * dpp;
    canvas.width = window.innerWidth * dpp;
    canvas.height = window.innerHeight * dpp;

    var GL = canvas.getContext("webgl");
    GL.viewportWidth = width;
    GL.viewportHeight = height;

    var shader_vertex_source = document.querySelector("#vertex").innerHTML;
    var shader_fragment_source = document.querySelector("#fragment").innerHTML;

    var get_shader = function(source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
            return false;
        }
        return shader;
    };
    var shader_vertex = get_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
    var shader_fragment = get_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

    var shader_program = GL.createProgram();
    GL.attachShader(shader_program, shader_vertex);
    GL.attachShader(shader_program, shader_fragment);
    GL.linkProgram(shader_program);
    var position = GL.getAttribLocation(shader_program, "position");
    GL.enableVertexAttribArray(position);
    GL.useProgram(shader_program);

    var vertices = [-1,-1,1,-1,1,1,-1,1];
    var vertex_buffer = GL.createBuffer ();
    GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);

    var faces = [0,1,2,3];
    var face_buffer = GL.createBuffer ();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, face_buffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces), GL.STATIC_DRAW);

    GL.viewport(0.0, 0.0, width, height);
    GL.clearColor(0.0, 0.0, 0.0, 0.0);

    var a = document.querySelector("input#a");
    var b = document.querySelector("input#b");
    var c = document.querySelector("input#c");
    var d = document.querySelector("input#d");
    var e = document.querySelector("input#e");
    var f = document.querySelector("input#f");
    var g = document.querySelector("input#g");

    GL.uniform1f(GL.getUniformLocation(shader_program, "width"), width / dpp);
    GL.uniform1f(GL.getUniformLocation(shader_program, "height"), height / dpp);

    var start_time = ((new Date).getTime() * 0.001);

    var animate = function() {
        GL.clear(GL.COLOR_BUFFER_BIT);
        GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buffer);
        GL.vertexAttribPointer(position, 2, GL.FLOAT, false, 4 * 2, 0);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, face_buffer);
        var time = ((new Date).getTime() * 0.001) - start_time;
        GL.uniform1f(GL.getUniformLocation(shader_program, "time"), time);
        GL.uniform1f(GL.getUniformLocation(shader_program, "slider_a"), a.value / 1000.0);
        GL.uniform1f(GL.getUniformLocation(shader_program, "slider_b"), b.value / 1000.0);
        GL.uniform1f(GL.getUniformLocation(shader_program, "slider_c"), c.value / 1000.0);
        GL.uniform1f(GL.getUniformLocation(shader_program, "slider_d"), d.value);
        GL.uniform1f(GL.getUniformLocation(shader_program, "slider_e"), e.value);
        GL.uniform1f(GL.getUniformLocation(shader_program, "slider_d"), f.value);
        GL.uniform1f(GL.getUniformLocation(shader_program, "slider_e"), g.value);
        GL.uniform3fv(GL.getUniformLocation(shader_program, "coloura"), HSBToRGB(d.value, f.value, 50))
        GL.uniform3fv(GL.getUniformLocation(shader_program, "colourb"), HSBToRGB(e.value, g.value, 50))
        GL.drawElements(GL.TRIANGLE_FAN, 4, GL.UNSIGNED_SHORT, 0);
        window.setTimeout(animate, 30);
    };

    animate();
};

window.addEventListener('load', init);
