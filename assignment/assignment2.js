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

function init() {
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

$(document).ready(function() {
	init();
})