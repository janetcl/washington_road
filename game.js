const scene = new THREE.Scene();

const distance = 500;
const camera = new THREE.OrthographicCamera( window.innerWidth/-2, window.innerWidth/2, window.innerHeight / 2, window.innerHeight / -2, 0.1, 10000 );

camera.rotation.x = 50*Math.PI/180;
camera.rotation.y = 20*Math.PI/180;
camera.rotation.z = 10*Math.PI/180;

const initialCameraPositionY = -Math.tan(camera.rotation.x)*distance;
const initialCameraPositionX = Math.tan(camera.rotation.y)*Math.sqrt(distance**2 + initialCameraPositionY**2);
camera.position.y = initialCameraPositionY;
camera.position.x = initialCameraPositionX;
camera.position.z = distance;

const zoom = 2;

const chickenSize = 15;

const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth*columns;

const stepTime = 200; // Miliseconds it takes for the chicken to take a step forward, backward, left or right

let lanes;
let currentLane;
let currentColumn;

let previousTimestamp;
let startMoving;
let moves;
let stepStartTimestamp;

const chicken = new Chicken();
scene.add( chicken );

const initaliseValues = () => {

    currentLane = 0;
    currentColumn = Math.floor(columns/2);

    previousTimestamp = null;

    startMoving = false;
    moves = [];
    stepStartTimestamp;

    chicken.position.x = 0;
    chicken.position.y = 0;

    camera.position.y = initialCameraPositionY;
    camera.position.x = initialCameraPositionX;
}

initaliseValues();

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
scene.add(hemiLight)

dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(-100, -100, 200);
dirLight.castShadow = true;
scene.add(dirLight);

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
var d = 500;
dirLight.shadow.camera.left = - d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = - d;

// var helper = new THREE.CameraHelper( dirLight.shadow.camera );
// var helper = new THREE.CameraHelper( camera );
// scene.add(helper)

backLight = new THREE.DirectionalLight(0x000000, .4);
backLight.position.set(200, 200, 50);
backLight.castShadow = true;
scene.add(backLight)

function Texture(width, height, rects) {
    const canvas = document.createElement( "canvas" );
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext( "2d" );
    context.fillStyle = "#ffffff";
    context.fillRect( 0, 0, width, height );
    context.fillStyle = "rgba(0,0,0,0.6)";
    rects.forEach(rect => {
      context.fillRect(rect.x, rect.y, rect.w, rect.h);
    });
    return new THREE.CanvasTexture(canvas);
}

function Three() {
    const three = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 15*zoom, 15*zoom, 20*zoom ),
      new THREE.MeshPhongMaterial( { color: 0x4d2926, flatShading: true } )
    );
    trunk.position.z = 10*zoom;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    three.add(trunk);

    height = threeHeights[Math.floor(Math.random()*threeHeights.length)];

    const crown = new THREE.Mesh(
        new THREE.BoxBufferGeometry( 30*zoom, 30*zoom, height*zoom ),
        new THREE.MeshLambertMaterial( { color: 0x7aa21d, flatShading: true } )
    );
    crown.position.z = (height/2+20)*zoom;
    crown.castShadow = true;
    crown.receiveShadow = false;
    three.add(crown);

    return three;
}

function Chicken() {
    const chicken = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxBufferGeometry( chickenSize*zoom, chickenSize*zoom, 20*zoom ),
      new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } )
    );
    body.position.z = 10*zoom;
    body.castShadow = true;
    body.receiveShadow = true;
    chicken.add(body);

    const rowel = new THREE.Mesh(
        new THREE.BoxBufferGeometry( 2*zoom, 4*zoom, 2*zoom ),
        new THREE.MeshLambertMaterial( { color: 0xF0619A, flatShading: true } )
    );
    rowel.position.z = 21*zoom;
    rowel.castShadow = true;
    rowel.receiveShadow = false;
    chicken.add(rowel);

    return chicken;
}

window.addEventListener("keydown", event => {
    if (event.keyCode == '38') {
        // up arrow
        move('forward');
    }
    else if (event.keyCode == '40') {
        // down arrow
        move('backward');
    }
    else if (event.keyCode == '37') {
       // left arrow
       move('left');
    }
    else if (event.keyCode == '39') {
       // right arrow
       move('right');
    }
});

function move(direction) {
    const finalPositions = moves.reduce((position,move) => {
        if(move === 'forward') return {lane: position.lane+1, column: position.column};
        if(move === 'backward') return {lane: position.lane-1, column: position.column};
        if(move === 'left') return {lane: position.lane, column: position.column-1};
        if(move === 'right') return {lane: position.lane, column: position.column+1};
    }, {lane: currentLane, column: currentColumn})

    if (direction === 'forward') {
        if(!stepStartTimestamp) startMoving = true;
    }
    else if (direction === 'backward') {
        if(finalPositions.lane === 0) return;
        if(!stepStartTimestamp) startMoving = true;
    }
    else if (direction === 'left') {
       if(finalPositions.column === 0) return;
       if(!stepStartTimestamp) startMoving = true;
    }
    else if (direction === 'right') {
       if(finalPositions.column === columns - 1 ) return;
       if(!stepStartTimestamp) startMoving = true;
    }
    moves.push(direction);
}

function animate(timestamp) {
    requestAnimationFrame( animate );

    if(!previousTimestamp) previousTimestamp = timestamp;
    const delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;

    if(startMoving) {
        stepStartTimestamp = timestamp;
        startMoving = false;
    }

    if(stepStartTimestamp) {
        const moveDeltaTime = timestamp - stepStartTimestamp;
        const moveDeltaDistance = Math.min(moveDeltaTime/stepTime,1)*positionWidth*zoom;
        const jumpDeltaDistance = Math.sin(Math.min(moveDeltaTime/stepTime,1)*Math.PI)*8*zoom;
        switch(moves[0]) {
            case 'forward': {
                camera.position.y = initialCameraPositionY + currentLane*positionWidth*zoom + moveDeltaDistance;
                chicken.position.y = currentLane*positionWidth*zoom + moveDeltaDistance; // initial chicken position is 0
                chicken.position.z = jumpDeltaDistance;
                break;
            }
            case 'backward': {
                camera.position.y = initialCameraPositionY + currentLane*positionWidth*zoom - moveDeltaDistance;
                chicken.position.y = currentLane*positionWidth*zoom - moveDeltaDistance;
                chicken.position.z = jumpDeltaDistance;
                break;
            }
            case 'left': {
                camera.position.x = initialCameraPositionX + (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 - moveDeltaDistance;
                chicken.position.x = (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 - moveDeltaDistance; // initial chicken position is 0
                chicken.position.z = jumpDeltaDistance;
                break;
            }
            case 'right': {
                camera.position.x = initialCameraPositionX + (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 + moveDeltaDistance;
                chicken.position.x = (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 + moveDeltaDistance;
                chicken.position.z = jumpDeltaDistance;
                break;
            }
        }
        // Once a step has ended
        if(moveDeltaTime > stepTime) {
            switch(moves[0]) {
                case 'forward': {
                    currentLane++;
                    break;
                }
                case 'backward': {
                    currentLane--;
                    break;
                }
                case 'left': {
                    currentColumn--;
                    break;
                }
                case 'right': {
                    currentColumn++;
                    break;
                }
            }
            moves.shift();
            // If more steps are to be taken then restart counter otherwise stop stepping
            stepStartTimestamp = moves.length === 0 ? null : timestamp;
        }
    }

    renderer.render( scene, camera );
}

requestAnimationFrame( animate );
