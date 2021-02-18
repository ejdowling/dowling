'use strict';

$(function() {
    var canvas = $("canvas")[0];
    var imgCanvas = $("canvas")[1];
    var width = $(window).height()*2;
    var height = $(window).height()*2;
    width = width - width % 2;
    height = height - height % 2;
    canvas.width = width;
    canvas.height = height;
    imgCanvas.width = width;
    imgCanvas.height = height;
    var GL = canvas.getContext("webgl", {preserveDrawingBuffer: true, antialias:false});
    var ctx = imgCanvas.getContext("2d");
    GL.viewportWidth = canvas.width;
    GL.viewportHeight = canvas.height;

    var shader_vertex_source = $("#vertex").text();
    var shader_fragment_source = $("#fragment").text();
    var idx = 0;

    var get_shader=function(source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
            return false;
        }
        return shader;
    };

    var shader_vertex=get_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");

    var shader_fragment=get_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

    var SHADER_PROGRAM=GL.createProgram();
    GL.attachShader(SHADER_PROGRAM, shader_vertex);
    GL.attachShader(SHADER_PROGRAM, shader_fragment);

    GL.linkProgram(SHADER_PROGRAM);

    var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");

    GL.enableVertexAttribArray(_position);

    GL.useProgram(SHADER_PROGRAM);

    var trianGLe_vertex=[
        -1,-1, //first summit -> bottom left of the viewport -- 0
        1,-1, //bottom right of the viewport -- 1
        1,1,  //top right of the viewport -- 2
        -1,1, // -- 3
    ];

    var TRIANGLE_VERTEX= GL.createBuffer ();
    GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);
    GL.bufferData(GL.ARRAY_BUFFER,
        new Float32Array(trianGLe_vertex),
        GL.STATIC_DRAW);

    var trianGLe_faces = [0,1,2, 3];
    var TRIANGLE_FACES= GL.createBuffer ();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, TRIANGLE_FACES);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(trianGLe_faces),
        GL.STATIC_DRAW);


    var texture = GL.createTexture();

    var applyTexture = function() {
            GL.bindTexture(GL.TEXTURE_2D, texture);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.REPEAT);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.REPEAT);
        //GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
        //GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, imgCanvas);
        //GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        //GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR_MIPMAP_NEAREST);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
        //GL.generateMipmap(GL.TEXTURE_2D);
        GL.bindTexture(GL.TEXTURE_2D, null);

        GL.activeTexture(GL.TEXTURE0);
        GL.bindTexture(GL.TEXTURE_2D, texture);
        GL.uniform1i(GL.getUniformLocation(SHADER_PROGRAM, "sampler2d"), 0);
        GL.uniform1f(GL.getUniformLocation(SHADER_PROGRAM, "idx"), idx++);
    }

    GL.clearColor(0.0, 0.0, 0.0, 0.0);

var animate = function() {
    GL.viewport(0.0, 0.0, canvas.width, canvas.height);
    GL.clear(GL.COLOR_BUFFER_BIT);

    GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);

    var float_size = 4;
    GL.vertexAttribPointer(_position,   2, GL.FLOAT, false, float_size*(2), 0);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, TRIANGLE_FACES);
    GL.uniform1f(GL.getUniformLocation(SHADER_PROGRAM, "timestamp"), (new Date).getTime());
    GL.uniform1f(GL.getUniformLocation(SHADER_PROGRAM, "width"), width);
    GL.uniform1f(GL.getUniformLocation(SHADER_PROGRAM, "height"), height);

    GL.drawElements(GL.TRIANGLE_FAN, 4, GL.UNSIGNED_SHORT, 0);
    GL.flush();

    var array = new Uint8Array(width * height * 4);
    GL.readPixels(0, 0, width, height, GL.RGBA, GL.UNSIGNED_BYTE, array );

    var imgData=ctx.createImageData(width, height);
    for (var i=0;i<imgData.data.length;i+=4)
    {
        imgData.data[i+0]=array[i];
        imgData.data[i+1]=array[i+1];
        imgData.data[i+2]=array[i+2];
        imgData.data[i+3]=array[i+3];
    }

    ctx.putImageData(imgData, 0, 0);
    applyTexture();

    window.requestAnimationFrame(animate);
};
animate();
});
