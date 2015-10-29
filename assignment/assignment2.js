"use strict";

var gl;

function initWebGL(canvas) {
    gl = null;

    try {   
        // Try to grab the standard context. If it fails, fallback to experimental.
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch(e) {}

    // If we don't have a GL context, give up now
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        gl = null;
    }
    return gl;
}

function init(birdMesh) {
    var canvas = document.getElementById("gl-canvas");

    gl = initWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // TODO: load shaders and initialise everything else

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // TODO: Render objects

    requestAnimFrame(render);
}

function loadMeshData(string) {

    var lines = string.split("\n");
    var positions = [];
    var normals = [];
    var vertices = [];
    for ( var i = 0 ; i < lines.length ; i++ ) {
        
        var parts = lines[i].trimRight().split(' ');
        if ( parts.length > 0 ) {

            switch(parts[0]) {
                case 'v':  
                    positions.push(
                        vec3.fromValues(
                            parseFloat(parts[1]),
                            parseFloat(parts[2]),
                            parseFloat(parts[3])
                        ));
                    break;
                case 'vn':
                    normals.push(
                        vec3.fromValues(
                            parseFloat(parts[1]),
                            parseFloat(parts[2]),
                            parseFloat(parts[3])
                        ));
                    break;
                case 'f': 
                {
                    var f1 = parts[1].split('//');
                    var f2 = parts[2].split('//');
                    var f3 = parts[3].split('//');
                    Array.prototype.push.apply(
                        vertices, positions[parseInt(f1[0]) - 1]);
                    // Array.prototype.push.apply(
                        // vertices, normals[parseInt(f1[2]) - 1]);
                    Array.prototype.push.apply(
                        vertices, positions[parseInt(f2[0]) - 1]);
                    // Array.prototype.push.apply(
                        // vertices, normals[parseInt(f2[2]) - 1]);
                    Array.prototype.push.apply(
                        vertices, positions[parseInt(f3[0]) - 1]);
                    // Array.prototype.push.apply(
                        // vertices, normals[parseInt(f3[2]) - 1]);
                    break;
                }
            }
        }
    }
    return {
        // primitiveType: 'TRIANGLES',
        primitiveType: 'GL_LINES',
        vertices: new Float32Array(vertices),
        vertexCount: vertices.length / 3,
        material: {ambient: 0.2, diffuse: 0.5, shininess: 10.0}
    };
}

function loadMesh(filename, callback) {
    $.ajax({
        url: filename,
        dataType: 'text'
    }).done(function(data) {
        console.log("Loaded mesh \"" + filename+ "\"");
        var meshData = loadMeshData(data);
        callback(meshData);
    }).fail(function() {
        alert("Failed to retrieve [" + filename + "]");
    });
}

$(document).ready(function() {
    loadMesh("Bird.obj", function(birdMesh) {
        init(birdMesh);
    });
})
