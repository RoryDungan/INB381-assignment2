var elt;

var canvas;
var gl;

var program;

var NumVertices = 36;

var pointsArray = [];
var normalsArray = [];
var colorsArray = [];

var framebuffer;

var flag = true;

var color = new Uint8Array(4);

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0),
];

var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(1.0, 1.0, 1.0, 1.0),  // white
];


var lightposition = vec4(1.0, 1.0, 1.0, 0.0);
var lightambientColor = vec4(0.2, 0.2, 0.2, 1.0);
var lightdiffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
var lightspecularColor = vec4(1.0, 1.0, 1.0, 1.0);



var materialambient = vec4(1.0, 1.0, 1.0, 1.0);
var materialdiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialspecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialshininess =100.0;


var ambientColor = null;
var diffuseColor = null;
var specularColor = null;

var modelView, projection;
var viewerPos;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = [45.0, 45.0, 45.0];

var thetaLoc;

var Index = 0;

function quad(a, b, c, d) {
    
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);
    normal = normalize(normal);
    
    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[b]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[a]);
    pointsArray.push(vertices[d]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[a]);
}


function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL(canvas, {});
    if (!gl) {
        alert("WebGL isn't available");
    }
    
    elt = document.getElementById("test");
    
    var ambientProduct = mult(lightambientColor, materialambient);
    var diffuseProduct = mult(lightdiffuseColor, materialdiffuse);
    var specularProduct = mult(lightspecularColor, materialspecular);
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    
    gl.enable(gl.CULL_FACE);
    
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.generateMipmap(gl.TEXTURE_2D);
    
    // Allocate a frame buffer object
    framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    colorCube();
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);
    
    var vColor = gl.getAttribLocation(program, 'vColor');
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
    
    var vNormal = gl.getAttribLocation(program, 'vNormal');
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    thetaLoc = gl.getUniformLocation(program, "theta");
    
    viewerPos = vec3(0.0, 0.0, -20.0);
    
    projection = ortho(-1, 1, -1, 1, -100, 100);
    
    document.getElementById("ButtonX").onclick = function () {
        axis = xAxis;
    };
    document.getElementById("ButtonY").onclick = function () {
        axis = yAxis;
    };
    document.getElementById("ButtonZ").onclick = function () {
        axis = zAxis;
    };
    document.getElementById("ButtonT").onclick = function () {
        flag = !flag
    };
    
    gl.uniform4fv(gl.getUniformLocation(program, 'ambientProduct'), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, 'diffuseProduct'), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, 'specularProduct'), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, 'lightPosition'), flatten(lightposition));
    gl.uniform1f(gl.getUniformLocation(program, 'shininess'), materialshininess);
    
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"),
        false, flatten(projection));
    
    canvas.addEventListener("mousedown", function(event) {
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform3fv(thetaLoc, theta);
        for (var i = 0; i < 6; i++) {
            gl.uniform1i(gl.getUniformLocation(program, "i"), i + 1);
            gl.drawArrays(gl.TRIANGLES, 6 * i, 6);
        }
        var x = event.clientX;
        var y = canvas.height - event.clientY;
        
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);
        
        if (color[0] == 255)
            if (color[1] == 255) elt.innerHTML = "<div> cyan </div>";
            else if (color[2] == 255) elt.innerHTML = "<div> magenta </div>";
            else elt.innerHTML = "<div> red </div>";
        else if (color[1] == 255)
            if (color[2] == 255) elt.innerHTML = "<div> blue </div>";
            else elt.innerHTML = "<div> yellow </div>";
        else if (color[2] == 255) elt.innerHTML = "<div> green </div>";
        else elt.innerHTML = "<div> background </div>";
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        gl.uniform1i(gl.getUniformLocation(program, "i"), 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform3fv(thetaLoc, theta);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    });
    
    render();
};

var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (flag) theta[axis] += 2.0;
    modelView = mat4();
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0]));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0]));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1]));
    
    gl.uniformMatrix4fv(gl.getUniformLocation(program,
        "modelViewMatrix"), false, flatten(modelView));
    
    gl.uniform1i(gl.getUniformLocation(program, "i"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    
    requestAnimFrame(render);
};
