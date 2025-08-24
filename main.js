const pipelines = ["NO_LIGHTS", "DEFAULT", "SPECULAR"];

const font = new Font("default");
font.scale = 0.6;
font.outline = 1.0;
font.outline_color = Color.new(0, 0, 0);

Screen.setFrameCounter(true);

const canvas = Screen.getMode();

canvas.zbuffering = true;
canvas.psm = Screen.CT32;
canvas.psmz = Screen.Z24;

Screen.setMode(canvas);
Screen.initBuffers();

const waterTexture = new Image("water.png");

waterTexture.filter = LINEAR;

function createFloorGrid(tileSize = 1.0, tilesX = 10, tilesZ = 10) {

    const positions = [];
    const normals = [];
    const texCoords = [];
    const colors = [];

    for (let x = 0; x < tilesX; x++) {

        for (let z = 0; z < tilesZ; z++) {

            const x0 = x * tileSize - (tilesX * tileSize) / 2.0;
            const z0 = z * tileSize - (tilesZ * tileSize) / 2.0;
            const x1 = x0 + tileSize;
            const z1 = z0 + tileSize;
            const y = 0.0;

            positions.push(
                x0, y, z0, 1.0,
                x1, y, z0, 1.0,
                x1, y, z1, 1.0,
                x0, y, z0, 1.0,
                x1, y, z1, 1.0,
                x0, y, z1, 1.0
            );

            for (let i = 0; i < 6; i++) {
                normals.push(0.0, 1.0, 0.0, 1.0)
            };

            const c = ((x + z) % 2 === 0) ? [1, 1, 1, 1] : [0.5, 0.5, 0.5, 1];

            for (let i = 0; i < 6; i++) {
                
                colors.push(...c)
            }

            texCoords.push(
                0.0, 0.0,
                1.0, 1.0,
                1.0, 0.0,
                1.0, 1.0,
                1.0, 1.0,
                1.0, 1.0
            );
        }
    }

    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        texCoords: new Float32Array(texCoords),
        colors: new Float32Array(colors)
    };
}

const gridData = createFloorGrid(1.0, 10, 10);
const vertList = Render.vertexList(gridData.positions, gridData.normals, gridData.texCoords, gridData.colors);
const gridRenderData = new RenderData(vertList);

gridRenderData.face_culling = Render.CULL_FACE_NONE;

const texID = gridRenderData.pushTexture(waterTexture);
const mats = gridRenderData.materials;
mats[0].decal_texture_id = texID;

gridRenderData.materials = mats;
gridRenderData.pipeline = Render.PL_SPECULAR;

const gridObject = new RenderObject(gridRenderData);

Render.init();
Render.setView(60.0, 5.0, 4000.0);

Camera.position(0.0, 5.0, 15.0);
Camera.target(0.0, 0.0, 0.0);

const light = Lights.new();

Lights.set(light, Lights.DIRECTION, 0.0, 0.0, 1.0);
Lights.set(light, Lights.AMBIENT, 0.2, 0.2, 0.2);
Lights.set(light, Lights.DIFFUSE, 0.8, 0.8, 0.8);

const grey = Color.new(40, 40, 40, 255);

const objVertices = new Float32Array(gridRenderData.vertices.positions);
const numVerts = objVertices.length / 4;
const distArray = new Float32Array(numVerts);

for (let i = 0; i < numVerts; i++) {

    const x = objVertices[i * 4 + 0];
    const z = objVertices[i * 4 + 2];
    distArray[i] = Math.sqrt(x * x + z * z);
}

const freq = 1.0;
const speed = 3.0;
const amp = 0.25;

while (true) {
    
    Screen.clear(grey);

    Camera.update();

    const time = (Date.now() % 1000000) * 0.001;

    for (let i = 0; i < numVerts; i++) {
        objVertices[i * 4 + 1] = Math.sin(distArray[i] * freq - time * speed) * amp;
    }

    gridObject.render();

    font.print(10, 10, Screen.getFPS(360) + " FPS | " + gridRenderData.size + " Vertices");

    Screen.flip();
}