

var numDivisions = 3;

var index = 0;

var points = [];
var normals = [];

var modelViewMatrix = [];
var projectionMatrix = [];

var axis =0;

var axis = 0;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var theta = [0, 0, 0];
var dTheta = 5.0;

var flag = true;

var program;

onload = function init()  {
    
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    

    var sum = [0, 0, 0];
    for(var i = 0; i<306; i++) for(j=0; j<3; j++)
      sum[j] += vertices[i][j];
      for(j=0; j<3; j++) sum[j]/=306;
        for(var i = 0; i<306; i++) for(j=0; j<2; j++)
       vertices[i][j] -= sum[j]/2
           for(var i = 0; i<306; i++) for(j=0; j<3; j++)
       vertices[i][j] *= 2;

    
    var h = 1.0/numDivisions;



    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};
        
    for(var i=0; i<numDivisions; i++) for(var j =0; j<numDivisions; j++) {
        points.push(data[i][j]);
        normals.push(ndata[i][j]);

        points.push(data[i+1][j]);
        normals.push(ndata[i+1][j]);

        points.push(data[i+1][j+1]);
        normals.push(ndata[i+1][j+1]);

        points.push(data[i][j]);
        normals.push(ndata[i][j]);

        points.push(data[i+1][j+1]);
        normals.push(ndata[i+1][j+1]);

        points.push(data[i][j+1]);
        normals.push(ndata[i][j+1]);
        index+= 6;
        }
    }

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program ); 
       
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    projectionMatrix = ortho(-4, 4, -4, 4, -200, 200);
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
    
    var lightPosition = vec4(0.0, 0.0, 20.0, 0.0 );
    var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
    var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
    var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

    var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
    var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
    var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
    var materialShininess = 10.0;
    
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct ));
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct));	
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition ));
    gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );


    render();
}

var render = function(){
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            if(flag) theta[axis] += 0.5;
            
            modelViewMatrix = mat4();
 
            modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], [1, 0, 0]));
            modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], [0, 1, 0]));
            modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], [0, 0, 1]));
            
            gl.uniformMatrix4fv( gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
                    
            gl.drawArrays( gl.TRIANGLES, 0, index);
            //for(var i=0; i<index; i+=3) gl.drawArrays( gl.LINE_LOOP, i, 3 );
            requestAnimFrame(render);
        }