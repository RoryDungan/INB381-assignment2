function WebGL(CID, FSID, VSID){
	var canvas = document.getElementById(CID);
	if(!canvas.getContext("webgl") && !canvas.getContext("experimental-webgl"))
		alert("Your Browser Doesn't Support WebGL");
	else
	{
		this.GL = (canvas.getContext("webgl")) ? canvas.getContext("webgl") : canvas.getContext("experimental-webgl");	
		
		this.GL.clearColor(1.0, 1.0, 1.0, 1.0); // this is the color 
		this.GL.enable(this.GL.DEPTH_TEST); //Enable Depth Testing
		this.GL.depthFunc(this.GL.LEQUAL); //Set Perspective View
		this.AspectRatio = canvas.width / canvas.height;
		
		var FShader = document.getElementById(FSID);
		var VShader = document.getElementById(VSID);
		
		if(!FShader || !VShader)
			alert("Error, Could Not Find Shaders");
		else
		{
			//Load and Compile Fragment Shader
			var Code = LoadShader(FShader);
			FShader = this.GL.createShader(this.GL.FRAGMENT_SHADER);
			this.GL.shaderSource(FShader, Code);
			this.GL.compileShader(FShader);
			
			//Load and Compile Vertex Shader
			Code = LoadShader(VShader);
			VShader = this.GL.createShader(this.GL.VERTEX_SHADER);
			this.GL.shaderSource(VShader, Code);
			this.GL.compileShader(VShader);
			
			//Create The Shader Program
			this.ShaderProgram = this.GL.createProgram();
			this.GL.attachShader(this.ShaderProgram, FShader);
			this.GL.attachShader(this.ShaderProgram, VShader);
			this.GL.linkProgram(this.ShaderProgram);
			this.GL.useProgram(this.ShaderProgram);
			
			//Link Vertex Position Attribute from Shader
			this.VertexPosition = this.GL.getAttribLocation(this.ShaderProgram, "VertexPosition");
			this.GL.enableVertexAttribArray(this.VertexPosition);
			
			//Link Texture Coordinate Attribute from Shader
			this.VertexTexture = this.GL.getAttribLocation(this.ShaderProgram, "TextureCoord");
			this.GL.enableVertexAttribArray(this.VertexTexture);
			
			//This is the new Normals array attribute
			this.VertexNormal = this.GL.getAttribLocation(this.ShaderProgram, "VertexNormal");
			this.GL.enableVertexAttribArray(this.VertexNormal);
			
		}
		this.PrepareModel = function(Model){
			Model.Image = this.LoadTexture(Model.Image);
			
			//Convert Arrays to buffers
			var Buffer = this.GL.createBuffer();
			
			this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Buffer); 
			this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(Model.Vertices), this.GL.STATIC_DRAW);
			Model.Vertices = Buffer;
			
			Buffer = this.GL.createBuffer();
			
			this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, Buffer); 
			this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(Model.Triangles), this.GL.STATIC_DRAW);
			Model.Triangles = Buffer;
			
			Buffer = this.GL.createBuffer();
			
			this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Buffer); 
			this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(Model.TextureMap), this.GL.STATIC_DRAW);
			Model.TextureMap = Buffer;
			
			if(false !== Model.Normals)
			{
				Buffer = this.GL.createBuffer();
				
				this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Buffer); 
				this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(Model.Normals), this.GL.STATIC_DRAW);
				Model.Normals = Buffer;
			}
			
			Model.Ready = true;
		};
		this.Draw = function(Model)
		{
			if(Model.Image.ReadyState == true && Model.Ready == false)
			{
				this.PrepareModel(Model);
			}
			if(Model.Ready)
			{
				this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Model.Vertices); 
				this.GL.vertexAttribPointer(this.VertexPosition, 3, this.GL.FLOAT, false, 0, 0); 
			    
			    
				this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Model.TextureMap);
				this.GL.vertexAttribPointer(this.VertexTexture, 2, this.GL.FLOAT, false, 0, 0);
				
				if(false !== Model.Normals)
				{
					//Connect The normals buffer to the Shader
					this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Model.Normals);
					this.GL.vertexAttribPointer(this.VertexNormal, 3, this.GL.FLOAT, false, 0, 0);
					
					//Tell The shader to use lighting
					var UseLights = this.GL.getUniformLocation(this.ShaderProgram, "UseLights");  
					this.GL.uniform1i(UseLights, true);
				}
				else
				{
					//Even if our object has no normals data we still have to pass something
					//So I pass in the Vertices instead
					this.GL.bindBuffer(this.GL.ARRAY_BUFFER, Model.Vertices);
					this.GL.vertexAttribPointer(this.VertexNormal, 3, this.GL.FLOAT, false, 0, 0);
					
					//Tell The shader to use lighting
					var UseLights = this.GL.getUniformLocation(this.ShaderProgram, "UseLights");  
					this.GL.uniform1i(UseLights, false);
				}
				
				this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, Model.Triangles);
				
				//Generate The Perspective Matrix
				var PerspectiveMatrix = MakePerspective(45, this.AspectRatio, 1, 1000.0);  
				
				var TransformMatrix = Model.GetWorldTransforms();
				
				var NormalsMatrix =  MatrixTranspose(InverseMatrix(TransformMatrix));
	
				//Set slot 0 as the active Texture
				this.GL.activeTexture(this.GL.TEXTURE0);
				
				//Load in the Texture To Memory
				this.GL.bindTexture(this.GL.TEXTURE_2D, Model.Image);
				
				//Update The Texture Sampler in the fragment shader to use slot 0
				this.GL.uniform1i(this.GL.getUniformLocation(this.ShaderProgram, "uSampler"), 0);
				
				//Set The Perspective and Transformation Matrices
				var pmatrix = this.GL.getUniformLocation(this.ShaderProgram, "PerspectiveMatrix");  
				this.GL.uniformMatrix4fv(pmatrix, false, new Float32Array(PerspectiveMatrix));
				
				var tmatrix = this.GL.getUniformLocation(this.ShaderProgram, "TransformationMatrix");  
				this.GL.uniformMatrix4fv(tmatrix, false, new Float32Array(TransformMatrix));  
				
				var nmatrix = this.GL.getUniformLocation(this.ShaderProgram, "NormalTransformation");  
				this.GL.uniformMatrix4fv(nmatrix, false, new Float32Array(NormalsMatrix));  
				
				//Draw The Triangles
				this.GL.drawElements(this.GL.TRIANGLES, Model.TriangleCount, this.GL.UNSIGNED_SHORT, 0);
			}
		};
		this.LoadTexture = function(Img){
			//Create a new Texture and Assign it as the active one
			var TempTex = this.GL.createTexture();
			this.GL.bindTexture(this.GL.TEXTURE_2D, TempTex);  
			this.GL.pixelStorei(this.GL.UNPACK_FLIP_Y_WEBGL, true);
			//Load in The Image
			this.GL.texImage2D(this.GL.TEXTURE_2D, 0, this.GL.RGBA, this.GL.RGBA, this.GL.UNSIGNED_BYTE, Img);  
			
			//Setup Scaling properties
			this.GL.texParameteri(this.GL.TEXTURE_2D, this.GL.TEXTURE_MAG_FILTER, this.GL.LINEAR);  
			this.GL.texParameteri(this.GL.TEXTURE_2D, this.GL.TEXTURE_MIN_FILTER, this.GL.LINEAR_MIPMAP_NEAREST);  
			this.GL.generateMipmap(this.GL.TEXTURE_2D); 
			
			//Unbind the texture and return it.
			this.GL.bindTexture(this.GL.TEXTURE_2D, null);
			return TempTex;
		};
	}
}



function MatrixTranspose(A)
{
	return [
		A[0], A[4], A[8], A[12],
		A[1], A[5], A[9], A[13],
		A[2], A[6], A[10], A[14],
		A[3], A[7], A[11], A[15]
	];
}
function InverseMatrix(A)
{
    var s0 = A[0] * A[5] - A[4] * A[1];
    var s1 = A[0] * A[6] - A[4] * A[2];
    var s2 = A[0] * A[7] - A[4] * A[3];
    var s3 = A[1] * A[6] - A[5] * A[2];
    var s4 = A[1] * A[7] - A[5] * A[3];
    var s5 = A[2] * A[7] - A[6] * A[3];

    var c5 = A[10] * A[15] - A[14] * A[11];
    var c4 = A[9] * A[15] - A[13] * A[11];
    var c3 = A[9] * A[14] - A[13] * A[10];
    var c2 = A[8] * A[15] - A[12] * A[11];
    var c1 = A[8] * A[14] - A[12] * A[10];
    var c0 = A[8] * A[13] - A[12] * A[9];

    var invdet = 1.0 / (s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0);

    var B = [];

    B[0] = ( A[5] * c5 - A[6] * c4 + A[7] * c3) * invdet;
    B[1] = (-A[1] * c5 + A[2] * c4 - A[3] * c3) * invdet;
    B[2] = ( A[13] * s5 - A[14] * s4 + A[15] * s3) * invdet;
    B[3] = (-A[9] * s5 + A[10] * s4 - A[11] * s3) * invdet;

    B[4] = (-A[4] * c5 + A[6] * c2 - A[7] * c1) * invdet;
    B[5] = ( A[0] * c5 - A[2] * c2 + A[3] * c1) * invdet;
    B[6] = (-A[12] * s5 + A[14] * s2 - A[15] * s1) * invdet;
    B[7] = ( A[8] * s5 - A[10] * s2 + A[11] * s1) * invdet;

    B[8] = ( A[4] * c4 - A[5] * c2 + A[7] * c0) * invdet;
    B[9] = (-A[0] * c4 + A[1] * c2 - A[3] * c0) * invdet;
    B[10] = ( A[12] * s4 - A[13] * s2 + A[15] * s0) * invdet;
    B[11] = (-A[8] * s4 + A[9] * s2 - A[11] * s0) * invdet;

    B[12] = (-A[4] * c3 + A[5] * c1 - A[6] * c0) * invdet;
    B[13] = ( A[0] * c3 - A[1] * c1 + A[2] * c0) * invdet;
    B[14] = (-A[12] * s3 + A[13] * s1 - A[14] * s0) * invdet;
    B[15] = ( A[8] * s3 - A[9] * s1 + A[10] * s0) * invdet;

    return B;

}

function GLObject(VertexArr, TriangleArr, TextureArr, ImageSrc, NormalsArr){
	this.Pos           = { X : 0, Y : 0, Z : 0};
	this.Scale         = { X : 1.0, Y : 1.0, Z : 1.0};
	this.Rotation      = { X : 0, Y : 0, Z : 0};
	this.Vertices      = VertexArr;
	this.Normals	   = NormalsArr;
	this.Triangles     = TriangleArr;
	this.TriangleCount = TriangleArr.length;
	this.TextureMap    = TextureArr;
	this.Image 		   = new Image();
	this.Image.onload  = function(){ this.ReadyState = true; };
	this.Image.src     = ImageSrc; 
	this.Ready		   = false;
	this.Children	   = [];
	this.Parent 	   = null;
	// Get the local transform of this object relative to its parent
	this.GetLocalTransforms = function(){
		//Create a Blank Identity Matrix
		var TMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		
		//Scaling
		var Temp  = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		Temp[0]  *= this.Scale.X;
		Temp[5]  *= this.Scale.Y;
		Temp[10] *= this.Scale.Z;
		TMatrix   = MultiplyMatrix(TMatrix, Temp);
		
		//Rotating X
		Temp     = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		var X    = this.Rotation.X * (Math.PI / 180.0);
		Temp[5]  = Math.cos(X);
		Temp[6]  = Math.sin(X);
		Temp[9]  = -1 * Math.sin(X);
		Temp[10] = Math.cos(X);
		TMatrix  = MultiplyMatrix(TMatrix, Temp);
		
		
		//Rotating Y
		Temp     = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		var Y    = this.Rotation.Y * (Math.PI / 180.0);
		Temp[0]  = Math.cos(Y);
		Temp[2]  = -1 * Math.sin(Y);
		Temp[8]  = Math.sin(Y);
		Temp[10] = Math.cos(Y);
		TMatrix  = MultiplyMatrix(TMatrix, Temp);
		
		//Rotating Z
		Temp     = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		var Z    = this.Rotation.Z * (Math.PI / 180.0);
		Temp[0]  = Math.cos(Z);
		Temp[1]  = Math.sin(Z);
		Temp[4]  = -1 * Math.sin(Z);
		Temp[5]  = Math.cos(Z);
		TMatrix  = MultiplyMatrix(TMatrix, Temp);
		
		
		//Moving
		Temp = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		Temp[12] = this.Pos.X;
		Temp[13] = this.Pos.Y;
		Temp[14] = this.Pos.Z * -1;
		
		return MultiplyMatrix(TMatrix, Temp);
	};
	// Get the transform matrix for the absolute position of this object in world space.
	this.GetWorldTransforms = function() {
		// If we are a root object then local space is world space
		if (!this.Parent) {
			return this.GetLocalTransforms();
		}

		return MultiplyMatrix(this.GetLocalTransforms(), this.Parent.GetWorldTransforms());
	};

	this.SetParent = function(parent) {
		// Remove us from our parent
		if (this.Parent) {
			var index = this.Parent.Children.indexOf(this);
			if (index >= 0) {
				this.Parent.Children.splice(index, 1);
			}
		}

		// Add us to the new parent
		if (parent) {
			parent.Children.push(this);
		}
		this.Parent = parent;
	}
}



function MakePerspective(FOV, AspectRatio, Closest, Farest){
	var YLimit = Closest * Math.tan(FOV * Math.PI / 360);
	var A = -( Farest + Closest ) / ( Farest - Closest );
	var B = -2 * Farest * Closest / ( Farest - Closest );
	var C = (2 * Closest) / ( (YLimit * AspectRatio) * 2 );
	var D =	(2 * Closest) / ( YLimit * 2 );
	return [
		C, 0, 0, 0,
		0, D, 0, 0,
		0, 0, A, -1,
		0, 0, B, 0
	];
}
function MakeTransform(Object){
	var y = Object.Rotation * (Math.PI / 180.0);
	var A = Math.cos(y);
	var B = -1 * Math.sin(y);
	var C = Math.sin(y);
	var D = Math.cos(y);
	Object.Rotation += .3;	
	return [
		A, 0, B, 0,
		0, 1, 0, 0,
		C, 0, D, 0,
		0, 0, -6, 1
	];
}

function MH(A, B)
{
	var Sum = 0;
	for(var i = 0; i<A.length; i++)
	{
		Sum += A[i]*B[i];
	}
	return Sum;
}

function MultiplyMatrix(A, B)
{
		var A1 = [ A[0],  A[1],  A[2],  A[3]];
		var A2 = [ A[4],  A[5],  A[6],  A[7]];
		var A3 = [ A[8],  A[9], A[10], A[11]];
		var A4 = [A[12], A[13], A[14], A[15]];
		
		var B1 = [B[0], B[4],  B[8], B[12]];
		var B2 = [B[1], B[5],  B[9], B[13]];
		var B3 = [B[2], B[6], B[10], B[14]];
		var B4 = [B[3], B[7], B[11], B[15]];
		
		return [
			MH(A1, B1), MH(A1, B2), MH(A1, B3), MH(A1, B4),
			MH(A2, B1), MH(A2, B2), MH(A2, B3), MH(A2, B4),
			MH(A3, B1), MH(A3, B2), MH(A3, B3), MH(A3, B4),
			MH(A4, B1), MH(A4, B2), MH(A4, B3), MH(A4, B4)
		];
}

function LoadShader(Script){
	var Code = "";
	var CurrentChild = Script.firstChild;
	while(CurrentChild)
	{
		if(CurrentChild.nodeType == CurrentChild.TEXT_NODE)
			Code += CurrentChild.textContent;
		CurrentChild = CurrentChild.nextSibling;
	}
	return Code;
}

function LoadModel(ModelName, CB){
	var Ajax;
	Ajax = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
	Ajax.onreadystatechange = function(){
		if(Ajax.readyState == 4 && Ajax.status == 200)
		{
			//Parse Model Data
			var Script = Ajax.responseText.split("\n");

			// List of objects
			var objects = [];
			var currentObject;
			
			var Counter = 0;
			
			for(var I in Script)
			{
				var Line = Script[I];

				// Object line
				if(Line.substring(0,2) == "o ")
				{
					objects.push({
						Vertices : [],
						VerticeMap : [],
						Triangles : [],
						Textures : [],
						TextureMap : [],
						Normals : [],
						NormalMap : []
					});
					currentObject = objects.length - 1;

					Counter = 0;
				}

				//If Vertice Line
				if(Line.substring(0,2) == "v ")
				{
					var Row = Line.substring(2).split(" ");
					objects[currentObject].Vertices.push({ X : parseFloat(Row[0]), Y : parseFloat(Row[1]), Z : parseFloat(Row[2]) });
				}
				//Texture Line
				else if(Line.substring(0,2) == "vt")
				{
					var Row = Line.substring(3).split(" ");
					objects[currentObject].Textures.push({X : parseFloat(Row[0]), Y : parseFloat(Row[1])});
				}
				//Normals Line
				else if(Line.substring(0,2) == "vn")
				{
					var Row = Line.substring(3).split(" ");
					objects[currentObject].Normals.push({X : parseFloat(Row[0]), Y : parseFloat(Row[1]), Z : parseFloat(Row[2]) });
				}
				//Mapping Line
				else if(Line.substring(0,2) == "f ")
				{
					var Row = Line.substring(2).split(" ");
					for(var T in Row)
					{
						//Remove Blank Entries
						if(Row[T] != "")
						{
							//If this is a multi-value entry
							if(Row[T].indexOf("/") != -1)
							{
								var TC = Row[T].split("/"); //Split the different values
								objects[currentObject].Triangles.push(Counter); //Increment The Triangles Array
								Counter++;
								
								// Work out mapping offset
								var vertexOffset = 0;
								for (var i = 0; i < objects.length - 1; i++) {
									vertexOffset += objects[i].Vertices.length;
								}
								//Insert Vertices 
								var index = (parseInt(TC[0]) - 1) - vertexOffset;
								objects[currentObject].VerticeMap.push(objects[currentObject].Vertices[index].X);
								objects[currentObject].VerticeMap.push(objects[currentObject].Vertices[index].Y);
								objects[currentObject].VerticeMap.push(objects[currentObject].Vertices[index].Z);
								
								//Insert Textures
								var textureOffset = 0;
								for (var i = 0; i < objects.length - 1; i++) {
									textureOffset += objects[i].Textures.length;
								}
								index = (parseInt(TC[1]) - 1) - textureOffset;
								objects[currentObject].TextureMap.push(objects[currentObject].Textures[index].X);
								objects[currentObject].TextureMap.push(objects[currentObject].Textures[index].Y);
								
								//If This Entry Has Normals Data
								if(TC.length>2)
								{
									//Insert Normals
									var normalsOffset = 0;
									for (var i = 0; i < objects.length - 1; i++) {
										normalsOffset += objects[i].Normals.length;
									}

									index = (parseInt(TC[2]) - 1) - normalsOffset;
									objects[currentObject].NormalMap.push(objects[currentObject].Normals[index].X);
									objects[currentObject].NormalMap.push(objects[currentObject].Normals[index].Y);
									objects[currentObject].NormalMap.push(objects[currentObject].Normals[index].Z);
								}
							}
							//For single value entries
							else
							{
								objects[currentObject].Triangles.push(Counter); //Increment The Triangles Array
								Counter++;

								// Work out mapping offset
								var vertexOffset = 0;
								for (var i = 0; i < objects.length - 1; i++) {
									vertexOffset += objects.Vertices.length;
								}
								// Push faces
								var index = (parseInt(Row[T]) - 1) - vertexOffset;
								objects[currentObject].VerticeMap.push(Vertices[index].X);
								objects[currentObject].VerticeMap.push(Vertices[index].Y);
								objects[currentObject].VerticeMap.push(Vertices[index].Z);
							}
						}
					}
				}
			}
			//Return The Arrays
			CB(objects);
		}
	}
	Ajax.open("GET", ModelName + ".obj", true);
	Ajax.send();
}


