const counterDOM = document.getElementById('counter');
const counterFinalDOM = document.getElementById('counterFinal');
const endDOM = document.getElementById('end');
const introDOM = document.getElementById('intro');

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

let gameEnded;
let coinCount = 0;
let enteredIceTimestamp = 0;
let onIce = false;
let gameStarted = false;
let difficulty;
let washingtonRoadSound;
let washingtonSound;
let iceSound;
let laneSpeeds;
let plankSpeeds;

// WASHINGTON ROAD: Initializing new textures (water, ice, planks, trucks)
const waterTexture = new THREE.TextureLoader().load("textures/ice.jpg");
const iceTexture1 = new THREE.TextureLoader().load("textures/icetexture.jpg");
const iceTexture2 = new THREE.TextureLoader().load("textures/watertexture.jpg");
const iceTexture3 = new THREE.TextureLoader().load("textures/icetexture2.jpg");
const plankTexture = new THREE.TextureLoader().load("textures/wood1.png");
const psafeTexture = new THREE.TextureLoader().load("textures/psafe.png");
const psafeTexture2 = new THREE.TextureLoader().load("textures/psafe.png");
psafeTexture2.flipY = false;
psafeTexture.flipX = false;
const umatterTexture = new THREE.TextureLoader().load("textures/umatter.jpg");
const umatterTexture2 = new THREE.TextureLoader().load("textures/umatter.jpg");
umatterTexture2.flipY = false;
umatterTexture.flipX = false;

const carFrontTexture = new Texture(40,80,[{x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = new Texture(40,80,[{x: 10, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = new Texture(110,40,[{x: 10, y: 0, w: 50, h: 30 }, {x: 70, y: 0, w: 30, h: 30 }]);
const carLeftSideTexture = new Texture(110,40,[{x: 10, y: 10, w: 50, h: 30 }, {x: 70, y: 10, w: 30, h: 30 }]);

const truckFrontTexture = new Texture(30,30,[{x: 15, y: 0, w: 10, h: 30 }]);
const truckRightSideTexture = new Texture(25,30,[{x: 0, y: 15, w: 10, h: 10 }]);
const truckLeftSideTexture = new Texture(25,30,[{x: 0, y: 5, w: 10, h: 10 }]);

var frustum = new THREE.Frustum();
var cameraViewProjectionMatrix = new THREE.Matrix4();

const generateLanes = () => [-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9].map((index) => {
    const lane = new Lane(index);
    lane.mesh.position.y = index*positionWidth*zoom;
    scene.add( lane.mesh );
    return lane;
}).filter((lane) => lane.index >= 0);

// WASHINGTON ROAD: added different lane speeds for varying difficulty levels
const addLane = () => {
    for (let i = 0; i < laneSpeeds['easy'].length; i++) {
      laneSpeeds['easy'][0] += 0.01;
    }
    for (let i = 0; i < laneSpeeds['medium'].length; i++) {
      laneSpeeds['medium'][0] += 0.01;
    }
    for (let i = 0; i < laneSpeeds['hard'].length; i++) {
      laneSpeeds['hard'][0] += 0.01;
    }
    for (let i = 0; i < plankSpeeds['easy'].length; i++) {
      plankSpeeds['easy'][0] += 0.01;
    }
    for (let i = 0; i < plankSpeeds['medium'].length; i++) {
      plankSpeeds['medium'][0] += 0.01;
    }
    for (let i = 0; i < plankSpeeds['hard'].length; i++) {
      plankSpeeds['hard'][0] += 0.01;
    }
    const index = lanes.length;
    const lane = new Lane(index);
    // console.log(lane);
    lane.mesh.position.y = index*positionWidth*zoom;
    scene.add(lane.mesh);
    lanes.push(lane);
}

const chicken = new Chicken();
scene.add( chicken );

// WASHINGTON ROAD: added difficulty types, different truck colors and textures
const laneTypes = ['car', 'truck', 'forest', 'river', 'ice', 'animal'];
const difficultyTypes = ['easy', 'medium', 'hard'];
const vehicleColors = [0xa52523, 0xbdb638, 0x78b14b];
const truckColors = [0xffffff, 0xb4c6fc];
const truckTextures = [psafeTexture, umatterTexture];
const truckTextures2 = [psafeTexture2, umatterTexture2];

const threeHeights = [20,45,60];

// WASHINGTON ROAD: Modified initialization to include new features
const initializeValues = () => {
    laneSpeeds = {'easy': [1, 1.5, 2, 3], 'medium': [2, 2.5, 3, 4, 5, 6], 'hard': [3, 3.5, 4.5, 6, 9]}
    plankSpeeds = {'easy': [2.5, 3.5, 4, 5], 'medium': [3.5, 4.5, 5.5, 6.5], 'hard': [4, 5, 6.5, 8.5]};

    lanes = generateLanes();
    var listener = new THREE.AudioListener();
    camera.add( listener );
    washingtonRoadSound = new THREE.Audio( listener );
    var washingtonLoader = new THREE.AudioLoader();
    washingtonLoader.load( 'sounds/washington.mp3', function( buffer ) {
    	washingtonRoadSound.setBuffer( buffer );
    	washingtonRoadSound.setLoop( false );
    	washingtonRoadSound.setVolume( 0.5 );
    	washingtonRoadSound.play();
    });

    currentLane = 0;
    currentColumn = Math.floor(columns/2);
    coinCount = 0;
    previousTimestamp = null;

    startMoving = false;
    moves = [];
    stepStartTimestamp;
    enteredIceTimestamp = 0;
    onIce = false;

    chicken.position.x = 0;
    chicken.position.y = 0;
    chicken.rotation.x = 0;
    chicken.rotation.y = 0;

    camera.position.y = initialCameraPositionY;
    camera.position.x = initialCameraPositionX;
    counterDOM.innerHTML = 0;
    counterDOM.style.visibility = 'visible';
    gameEnded = false;

    iceMaterial.map = iceTexture1;
    iceTexture2.dispose();
}


const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize( window.innerWidth - 1, window.innerHeight - 1);
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

function Wheel() {
    const wheel = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 12*zoom, 33*zoom, 12*zoom ),
      new THREE.MeshLambertMaterial( { color: 0x333333, flatShading: true } )
    );
    wheel.position.z = 6*zoom;
    return wheel;
}
// WASHINGTON ROAD: Coins increase the player score
function Coin() {
  var geometry = new THREE.CylinderBufferGeometry( 10*zoom, 10*zoom, 6*zoom, 10 );
  var material = new THREE.MeshPhongMaterial( {color: 0xFFDF2D, flatShading: true} );
  var coin = new THREE.Mesh( geometry, material );
  coin.castShadow = true;
  coin.receiveShadow = true;
  coin.rotation.setFromVector3(new THREE.Vector3( Math.PI / 2, 0, 0));
  coin.position.z = 1 * zoom;
  return coin;
}

function Car() {
  const car = new THREE.Group();
  const color = vehicleColors[Math.floor(Math.random() * vehicleColors.length)];

  const main = new THREE.Mesh(
    new THREE.BoxBufferGeometry( 60*zoom, 30*zoom, 15*zoom ),
    new THREE.MeshPhongMaterial( { color, flatShading: true, reflectivity: 1.0, shininess: 50 } )
  );
  main.position.z = 12*zoom;
  main.castShadow = true;
  main.receiveShadow = true;
  car.add(main)

  const cabin = new THREE.Mesh(
    new THREE.BoxBufferGeometry( 33*zoom, 24*zoom, 12*zoom ),
    [
      new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carBackTexture } ),
      new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carFrontTexture } ),
      new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carRightSideTexture } ),
      new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carLeftSideTexture } ),
      new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true } ), // top
      new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true } ) // bottom
    ]
  );
  cabin.position.x = 6*zoom;
  cabin.position.z = 25.5*zoom;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  car.add( cabin );

  const frontWheel = new Wheel();
  frontWheel.position.x = -18*zoom;
  car.add( frontWheel );

  const backWheel = new Wheel();
  backWheel.position.x = 18*zoom;
  car.add( backWheel );

  car.castShadow = true;
  car.receiveShadow = false;

  return car;
}

// WASHINGTON ROAD: created a Bagel Obstacle using TorusGeometry and the MeshToonMaterial
function Bagel() {
  var geometry = new THREE.TorusGeometry( 18, 10.2, 27, 100 );
  var material = new THREE.MeshToonMaterial( { color: 0xFCE9B0 } );
  var bagel = new THREE.Mesh( geometry, material );

  bagel.position.z = 10*zoom;

  return bagel;
}

function Truck() {
    const truck = new THREE.Group();
    const color = vehicleColors[Math.floor(Math.random() * vehicleColors.length)];
    // WASHINGTON ROAD: modified the truck texture to be either the UMatter Logo or the PSAFE Logo
    const truckColorVal = Math.floor(Math.random() * truckTextures.length);
    const cargoColor = truckColors[truckColorVal];
    const texture = truckTextures[truckColorVal];
    const texture2 = truckTextures2[truckColorVal];

    const base = new THREE.Mesh(
        new THREE.BoxBufferGeometry( 100*zoom, 25*zoom, 5*zoom ),
        new THREE.MeshLambertMaterial( { color: 0xb4c6fc, flatShading: true} )
    );
    base.position.z = 10*zoom;
    truck.add(base)

    const cargo = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 75*zoom, 35*zoom, 40*zoom ),
      [
        new THREE.MeshPhongMaterial( { color: cargoColor, flatShading: true } ), // back
        new THREE.MeshPhongMaterial( { color: cargoColor, flatShading: true } ),
        new THREE.MeshPhongMaterial( { color: cargoColor, flatShading: true, map: texture2 } ),
        new THREE.MeshPhongMaterial( { color: cargoColor, flatShading: true, map: texture } ),
        new THREE.MeshPhongMaterial( { color: cargoColor, flatShading: true } ), // top
        new THREE.MeshPhongMaterial( { color: cargoColor, flatShading: true } ) // bottom
      ]
      // new THREE.MeshPhongMaterial( { color: 0xb4c6fc, flatShading: true, map: texture } )
    );
    cargo.position.x = 15*zoom;
    cargo.position.z = 30*zoom;
    cargo.castShadow = true;
    cargo.receiveShadow = true;
    truck.add(cargo)

    const cabin = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 25*zoom, 30*zoom, 30*zoom ),
      [
        new THREE.MeshPhongMaterial( { color, flatShading: true } ), // back
        new THREE.MeshPhongMaterial( { color, flatShading: true, map: truckFrontTexture } ),
        new THREE.MeshPhongMaterial( { color, flatShading: true, map: truckRightSideTexture } ),
        new THREE.MeshPhongMaterial( { color, flatShading: true, map: truckLeftSideTexture } ),
        new THREE.MeshPhongMaterial( { color, flatShading: true } ), // top
        new THREE.MeshPhongMaterial( { color, flatShading: true } ) // bottom
      ]
    );
    cabin.position.x = -40*zoom;
    cabin.position.z = 20*zoom;
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    truck.add( cabin );

    const frontWheel = new Wheel();
    frontWheel.position.x = -38*zoom;
    truck.add( frontWheel );

    const middleWheel = new Wheel();
    middleWheel.position.x = -10*zoom;
    truck.add( middleWheel );

    const backWheel = new Wheel();
    backWheel.position.x = 30*zoom;
    truck.add( backWheel );

    return truck;
  }

// WASHINGTON ROAD: Created Plank() object for the river
  function Plank() {
    const car = new THREE.Group();
    const color = 0x9F5919;

    const main = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 80*zoom, 28*zoom, 8*zoom ),
      new THREE.MeshPhongMaterial( { color, flatShading: true, map: plankTexture } )
    );
    plankTexture.wrapS = plankTexture.wrapT = THREE.RepeatWrapping;
    main.position.z = 0*zoom;
    main.castShadow = true;
    main.receiveShadow = true;
    car.add(main)

    car.castShadow = true;
    car.receiveShadow = false;

    return car;
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

// WASHINGTON ROAD: modified the chicken Mesh Group to be a Princeton Student
function Chicken() {
    const chicken = new THREE.Group();

    const rightLeg = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 5*zoom, 5*zoom, 12*zoom ),
      new THREE.MeshPhongMaterial( { color: 0x0E5097, flatShading: true } )
    );
    rightLeg.position.z = 7*zoom;
    rightLeg.position.x = 4*zoom;
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;
    chicken.add(rightLeg);


    const leftLeg = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 5*zoom, 5*zoom, 12*zoom ),
      new THREE.MeshPhongMaterial( { color: 0x0E5097, flatShading: true } )
    );
    leftLeg.position.z = 7*zoom;
    leftLeg.position.x = -4*zoom;
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;
    chicken.add(leftLeg);

    const body = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 15*zoom, 9*zoom, 18*zoom ),
      new THREE.MeshPhongMaterial( { color: 0xff8f00, flatShading: true } )
    );
    body.position.z = 22*zoom;
    body.castShadow = true;
    body.receiveShadow = true;
    chicken.add(body);

    const leftArm = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 4*zoom, 4*zoom, 11*zoom ),
      new THREE.MeshPhongMaterial( { color: 0xff8f00, flatShading: true } )
    );
    leftArm.position.z = 25*zoom;
    leftArm.position.x = -9*zoom;
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    chicken.add(leftArm);

    const rightArm = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 4*zoom, 4*zoom, 11*zoom ),
      new THREE.MeshPhongMaterial( { color: 0xff8f00, flatShading: true } )
    );
    rightArm.position.z = 25*zoom;
    rightArm.position.x = 9*zoom;
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    chicken.add(rightArm);

    const head = new THREE.Mesh(
        new THREE.BoxBufferGeometry( 8*zoom, 8*zoom, 8*zoom ),
        new THREE.MeshLambertMaterial( { color: 0x000000, flatShading: true } )
    );
    head.position.z = 34*zoom;
    head.castShadow = true;
    head.receiveShadow = false;
    chicken.add(head);

    return chicken;
}

function Road() {
    const road = new THREE.Group();

    const createSection = color => new THREE.Mesh(
        new THREE.PlaneBufferGeometry( boardWidth*zoom, positionWidth*zoom ),
        new THREE.MeshPhongMaterial( { color } )
    );

    const middle = createSection(0x454A59);
    middle.receiveShadow = true;
    road.add(middle);

    const left = createSection(0x393D49);
    left.position.x = - boardWidth*zoom;
    road.add(left);

    const right = createSection(0x393D49);
    right.position.x = boardWidth*zoom;
    road.add(right);

    return road;
}

// WASHINGTON ROAD: attempted a "fire" lane type (still in progress)
function NotFire() {
    const ice = new THREE.Group();

    const createSection = color => new THREE.Mesh(
        new THREE.PlaneBufferGeometry( boardWidth*zoom, positionWidth*zoom ),
        new THREE.MeshPhongMaterial( { color } )
    );

    const middle = createSection(0x734012);
    middle.receiveShadow = true;
    ice.add(middle);

    const left = createSection(0x5D340F);
    left.position.x = - boardWidth*zoom;
    ice.add(left);

    const right = createSection(0x5D340F);
    right.position.x = boardWidth*zoom;
    ice.add(right);

    return ice;
}

// WASHINGTON ROAD: attempted a "fire" lane type (still in progress)
function Fire() {
    const ice = new THREE.Group();

    const createSection = color => new THREE.Mesh(
        new THREE.PlaneBufferGeometry( boardWidth*zoom, positionWidth*zoom ),
        new THREE.MeshPhongMaterial( { color } )
    );

    const middle = createSection(0xFF3333);
    middle.receiveShadow = true;
    ice.add(middle);

    const left = createSection(0xE60000);
    left.position.x = - boardWidth*zoom;
    ice.add(left);

    const right = createSection(0xE60000);
    right.position.x = boardWidth*zoom;
    ice.add(right);

    return ice;
}

// WASHINGTON ROAD: Created an Ice Material using different textures
const iceMaterial = new THREE.MeshPhongMaterial({color: 0xCEF4FF, shininess: 50, flatShading: true, reflectivity: 1.0, map: iceTexture1})
// WASHINGTON ROAD: Ice layer that players die on after standing for too long.
function Ice() {
    const ice = new THREE.Group();

    // const createSection = color => new THREE.Mesh(
    //     new THREE.PlaneBufferGeometry( boardWidth*zoom, positionWidth*zoom ),
    //     iceMaterial
    //     // new THREE.MeshPhongMaterial ({color, shininess: 50, flatShading: true, reflectivity: 1.0, map: iceTexture1})
    //     // new THREE.MeshPhongMaterial( { color, shininess: 50, reflectivity: 1.0 } )
    // );

    iceTexture1.wrapS = iceTexture1.wrapT = THREE.RepeatWrapping;
    iceTexture2.wrapS = iceTexture2.wrapT = THREE.RepeatWrapping;
    iceTexture3.wrapS = iceTexture3.wrapT = THREE.RepeatWrapping;

    const middle = new THREE.Mesh (new THREE.PlaneBufferGeometry( boardWidth*zoom, positionWidth*zoom ), iceMaterial);
    middle.receiveShadow = true;
    ice.add(middle);

    const left = new THREE.Mesh (new THREE.PlaneBufferGeometry( boardWidth*zoom, positionWidth*zoom ), iceMaterial);
    left.position.x = - boardWidth*zoom;
    ice.add(left);

    const right = new THREE.Mesh (new THREE.PlaneBufferGeometry( boardWidth*zoom, positionWidth*zoom ), iceMaterial);
    right.position.x = boardWidth*zoom;
    ice.add(right);

    ice.castShadow = true;
    ice.receiveShadow = true;

    return ice;
}

// WASHINGTON ROAD: attempted train lane (still in progress)
function Track() {
    const road = new THREE.Group();

    const createSection = color => new THREE.Mesh(
        new THREE.PlaneBufferGeometry( boardWidth*zoom, positionWidth*zoom ),
        new THREE.MeshPhongMaterial( { color } )
    );

    const middle = createSection(0x454A59);
    middle.receiveShadow = true;
    road.add(middle);

    const left = createSection(0x393D49);
    left.position.x = - boardWidth*zoom;
    road.add(left);

    const right = createSection(0x393D49);
    right.position.x = boardWidth*zoom;
    road.add(right);

    return road;
}

// WASHINGTON ROAD: water lane type for the river
function Water() {
    const water = new THREE.Group();

    const createSection = color => new THREE.Mesh(
        new THREE.BoxBufferGeometry( boardWidth*zoom, positionWidth*zoom, 3*zoom ),
        new THREE.MeshPhongMaterial ({color, shininess: 50, flatShading: true, reflectivity: 1.0})
    );

    const middle = createSection(0x71D4FF);
    middle.receiveShadow = true;
    water.add(middle);

    const left = createSection(0x37BFFF);
    left.position.x = - boardWidth*zoom;
    water.add(left);

    const right = createSection(0x37BFFF);
    right.position.x = boardWidth*zoom;
    water.add(right);

    return water;
}

function Grass() {
    const grass = new THREE.Group();

    const createSection = color => new THREE.Mesh(
        new THREE.BoxBufferGeometry( boardWidth*zoom, positionWidth*zoom, 3*zoom ),
        new THREE.MeshPhongMaterial( { color } )
    );

    const middle = createSection(0xB5FE6C);
    middle.receiveShadow = true;
    grass.add(middle);

    const left = createSection(0x99C846);
    left.position.x = - boardWidth*zoom;
    grass.add(left);

    const right = createSection(0x99C846);
    right.position.x = boardWidth*zoom;
    grass.add(right);

    grass.position.z = 1.5*zoom;
    return grass;
}

// array of 6 integers
function randomInProb(array) {
    let total = 0;
    let newArray = [];
    for (let i = 0; i < array.length; i++) {
      total += array[i];
      newArray.push(total);
    }
    let randomNum = Math.random()*total;
    if (randomNum > newArray[4]) return 5;
    if (randomNum > newArray[3]) return 4;
    if (randomNum > newArray[2]) return 3;
    if (randomNum > newArray[1]) return 2;
    if (randomNum > newArray[0]) return 1;
    return 0;
}

// WASHINGTON ROAD: modified probabilities of the next lane's procedural generation
function Lane(index) {
    this.index = index;
    if (index <= 0)
      this.type = 'field';
    else if (index < 10)
      this.type = laneTypes[Math.floor(Math.random()*laneTypes.length)];
    else {
      if (difficulty == 'easy') {
        if (lanes[lanes.length-1].type == 'forest')
          this.type = laneTypes[randomInProb([10, 5, Math.max(10, 80-0.1*index), 15, 10, 10])]
        else if (lanes[lanes.length-1].type == 'car')
          this.type = laneTypes[randomInProb([20, 10, Math.max(10, 150-0.1*index), 20, 10, 10])]
        else if (lanes[lanes.length-1].type == 'truck')
          this.type = laneTypes[randomInProb([20, 10, Math.max(10, 150-0.1*index), 20, 10, 10])]
        else if (lanes[lanes.length-1].type == 'river')
          this.type = laneTypes[randomInProb([10, 10, Math.max(10, 150-0.1*index), 70, 10, 10])]
        else if (lanes[lanes.length-1].type == 'ice')
          this.type = laneTypes[randomInProb([10, 10, Math.max(10, 100-0.1*index), 20, 20, 10])]
        else if (lanes[lanes.length-1].type == 'animal')
          this.type = laneTypes[randomInProb([10, 10, Math.max(10, 150-0.1*index), 20, 5, 10])]
      }
      else if (difficulty == 'medium') {
        if (lanes[lanes.length-1].type == 'forest')
          this.type = laneTypes[randomInProb([10, 5, Math.max(10, 80-0.1*index), 15, 10, 10])]
        else if (lanes[lanes.length-1].type == 'car')
          this.type = laneTypes[randomInProb([20, 10, Math.max(10, 70-0.1*index), 20, 10, 10])]
        else if (lanes[lanes.length-1].type == 'truck')
          this.type = laneTypes[randomInProb([20, 10, Math.max(10, 70-0.1*index), 20, 10, 10])]
        else if (lanes[lanes.length-1].type == 'river')
          this.type = laneTypes[randomInProb([10, 10, Math.max(10, 70-0.1*index), 70, 10, 10])]
        else if (lanes[lanes.length-1].type == 'ice')
          this.type = laneTypes[randomInProb([10, 10, Math.max(10, 70-0.1*index), 20, 20, 10])]
        else if (lanes[lanes.length-1].type == 'animal')
          this.type = laneTypes[randomInProb([10, 10, Math.max(10, 70-0.1*index), 20, 5, 10])]
      }
      else if (difficulty == 'hard') {
        if (lanes[lanes.length-1].type == 'forest')
          this.type = laneTypes[randomInProb([10, 5, Math.max(10, 20-0.1*index), 15, 10, 10])]
        else if (lanes[lanes.length-1].type == 'car')
          this.type = laneTypes[randomInProb([20, 10, Math.max(10, 30-0.1*index), 20, 10, 10])]
        else if (lanes[lanes.length-1].type == 'truck')
          this.type = laneTypes[randomInProb([20, 10, Math.max(10, 30-0.1*index), 20, 10, 10])]
        else if (lanes[lanes.length-1].type == 'river')
          this.type = laneTypes[randomInProb([10, 10, Math.max(10, 30-0.1*index), 70, 10, 10])]
        else if (lanes[lanes.length-1].type == 'ice')
          this.type = laneTypes[randomInProb([10, 10, Math.max(10, 30-0.1*index), 20, 20, 10])]
        else if (lanes[lanes.length-1].type == 'animal')
          this.type = laneTypes[randomInProb([10, 10, Math.max(10, 30-0.1*index), 20, 5, 10])]
      }
    }

    switch(this.type) {
        case 'field': {
            this.type = 'field';
            this.mesh = new Grass();
            break;
        }
        case 'forest': {
            this.mesh = new Grass();

            this.occupiedPositions = new Set();
            this.threes = [1,2,3,4].map(() => {
                const three = new Three();
                let position;
                do {
                    position = Math.floor(Math.random()*columns);
                }while(this.occupiedPositions.has(position))
                this.occupiedPositions.add(position);
                three.position.x = (position*positionWidth+positionWidth/2)*zoom-boardWidth*zoom/2;
                this.mesh.add( three );
                return three;
            })
            break;
        }
        case 'ice': {
            this.type = 'ice';
            this.mesh = new Ice();
            break;
        }
        case 'car' : {
            this.mesh = new Road();
            this.direction = Math.random() >= 0.5;

            const occupiedPositions = new Set();
            this.vehicles = [1,2,3].map(() => {
                const vehicle = new Car();
                let position;
                let good;
                do {
                    position = Math.floor(Math.random()*columns/2);
                    good = true;
                    for (let item of occupiedPositions) {
                      if (Math.abs(item - position) <= 1) good = false;
                    }
                }while(occupiedPositions.has(position) || !good)
                occupiedPositions.add(position);
                vehicle.position.x = (position*positionWidth*2+positionWidth/2)*zoom-boardWidth*zoom/2;
                if(!this.direction) vehicle.rotation.z = Math.PI;
                this.mesh.add( vehicle );
                return vehicle;
            })
            // WASHINGTON ROAD: Added coin types, included positions of coins
            this.coins = [1,2].map(() => {
                const coin = new Coin();
                let position;
                do {
                    position = Math.floor(Math.random()*columns/2);
                }while(occupiedPositions.has(position))
                occupiedPositions.add(position);
                coin.position.x = (position*positionWidth*2+positionWidth/2)*zoom-boardWidth*zoom/2;
                if(!this.direction) coin.rotation.z = Math.PI;
                this.mesh.add( coin );
                return coin;
            })

            this.speed = laneSpeeds[difficulty][Math.floor(Math.random()*laneSpeeds[difficulty].length)];
            break;
        }
        case 'truck' : {
            this.mesh = new Road();
            this.direction = Math.random() >= 0.5;

            const occupiedPositions = new Set();
            this.vehicles = [1,2].map(() => {
                const vehicle = new Truck();
                let position;
                let good;
                do {
                    position = Math.floor(Math.random()*columns/3);
                    good = true;
                    for (let item of occupiedPositions) {
                      if (Math.abs(item - position) <= 1) good = false;
                    }
                }while(occupiedPositions.has(position) || !good)
                occupiedPositions.add(position);
                vehicle.position.x = (position*positionWidth*3+positionWidth/2)*zoom-boardWidth*zoom/2;
                if(!this.direction) vehicle.rotation.z = Math.PI;
                this.mesh.add( vehicle );
                return vehicle;
            })

            // WASHINGTON ROAD: Added coin types, included positions of coins
            this.coins = [1,2].map(() => {
                const coin = new Coin();
                let position;
                do {
                    position = Math.floor(Math.random()*columns/2);
                }while(occupiedPositions.has(position))
                occupiedPositions.add(position);
                coin.position.x = (position*positionWidth*2+positionWidth/2)*zoom-boardWidth*zoom/2;
                if(!this.direction) coin.rotation.z = Math.PI;
                this.mesh.add( coin );
                return coin;
            })

            this.speed = laneSpeeds[difficulty][Math.floor(Math.random()*laneSpeeds[difficulty].length)];
            break;
        }
        // WASHINGTON ROAD: New river lane type with planks
        case 'river' : {
            this.type = 'river';
            this.mesh = new Water();
            this.direction = Math.random() >= 0.5;

            const occupiedPositions = new Set();
            this.vehicles = [1,2,3].map(() => {
                const vehicle = new Plank();
                let position;
                do {
                    position = Math.floor(Math.random()*columns/2);
                }while(occupiedPositions.has(position))
                occupiedPositions.add(position);
                vehicle.position.x = (position*positionWidth*2+positionWidth/2)*zoom-boardWidth*zoom/2;
                if(!this.direction) vehicle.rotation.z = Math.PI;
                this.mesh.add( vehicle );
                return vehicle;
            })

            this.speed = plankSpeeds[difficulty][Math.floor(Math.random()*plankSpeeds[difficulty].length)];
            break;
        }
        // WASHINGTON ROAD: lava lane type (in progress)
        case 'lava' : {
          this.mesh = new NotFire();
          this.period = Math.floor(Math.random()*800)+1000;
          this.startTime = Math.floor(Math.random()*this.period);
          break
        }
        // WASHINGTON ROAD: "animal" (aka bagel) lane type
        case 'animal' : {
          this.mesh = new Grass();
          this.direction = Math.random() >= 0.5;

          const occupiedPositions = new Set();
          this.vehicles = [1].map(() => {
              const vehicle = new Bagel();
              let position;
              do {
                  position = Math.floor(Math.random()*columns/3);
              }while(occupiedPositions.has(position))
              occupiedPositions.add(position);
              vehicle.position.x = (position*positionWidth*3+positionWidth/2)*zoom-boardWidth*zoom/2;
              if(!this.direction) vehicle.rotation.z = Math.PI;
              this.mesh.add( vehicle );
              return vehicle;
          })

          // WASHINGTON ROAD: Coins in the Animal lane
          this.coins = [1,2].map(() => {
              const coin = new Coin();
              let position;
              do {
                  position = Math.floor(Math.random()*columns/2);
              }while(occupiedPositions.has(position))
              occupiedPositions.add(position);
              coin.position.x = (position*positionWidth*2+positionWidth/2)*zoom-boardWidth*zoom/2;
              if(!this.direction) coin.rotation.z = Math.PI;
              this.mesh.add( coin );
              return coin;
          })

          this.speed = laneSpeeds[difficulty][Math.floor(Math.random()*laneSpeeds[difficulty].length)];
          break;
        }
    }
}

// document.querySelector("#mute").addEventListener("click", () => {
//   washingtonRoadSound.setVolume(0.0);
//   washingtonSound.setVolume(0.0);
//   iceSound.setVolume(0.0);
// })



document.querySelector("#retry").addEventListener("click", () => {
    lanes.forEach(lane => scene.remove( lane.mesh ));
    counterFinalDOM.style.visibility = 'hidden';
    endDOM.style.visibility = 'hidden';
    document.querySelector('canvas').visibility = 'hidden';
    introDOM.style.visibility = 'visible';
    counterDOM.style.visibility = 'hidden';
    gameStarted = false;
    gameEnded = false;
    lanes = [];
    washingtonRoadSound.stop();
});

window.addEventListener("keydown", event => {
    if (event.keyCode == '38' && gameStarted && !gameEnded) {
        event.preventDefault();
        // up arrow
        move('forward');
    }
    else if (event.keyCode == '40' && gameStarted && !gameEnded) {
        // down arrow
        event.preventDefault();
        move('backward');
    }
    else if (event.keyCode == '37' && gameStarted && !gameEnded) {
       // left arrow
       move('left');
    }
    else if (event.keyCode == '39' && gameStarted && !gameEnded) {
       // right arrow
       move('right');
    }
    // WASHINGTON ROAD: change the difficulty of the game depending on
    // what key the player presses.
    else if (event.keyCode == '69' && !gameStarted) {
      // easy difficulty
        gameStarted = true;
        difficulty = 'easy';
        introDOM.style.visibility = 'hidden';
        initializeValues();

    }
    else if (event.keyCode == '77' && !gameStarted) {
      // medium difficulty
        gameStarted = true;
        difficulty = 'medium';
        introDOM.style.visibility = 'hidden';
        initializeValues();

    }
    else if (event.keyCode == '72' && !gameStarted) {
      // hard difficulty
        gameStarted = true;
        difficulty = 'hard';
        introDOM.style.visibility = 'hidden';
        initializeValues();

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
        chicken.rotation.z = 0;
        if(lanes[finalPositions.lane+1].type === 'forest' && lanes[finalPositions.lane+1].occupiedPositions.has(finalPositions.column)) return;
        if(!stepStartTimestamp) startMoving = true;
    }
    else if (direction === 'backward') {
        chicken.rotation.z = Math.PI;
        if(finalPositions.lane === 0) return;
        if(lanes[finalPositions.lane-1].type === 'forest' && lanes[finalPositions.lane-1].occupiedPositions.has(finalPositions.column)) return;
        if(!stepStartTimestamp) startMoving = true;
    }
    else if (direction === 'left') {
      chicken.rotation.z = Math.PI/2;
       if(finalPositions.column === 0) return;
       if(lanes[finalPositions.lane].type === 'forest' && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column-1)) return;
       if(!stepStartTimestamp) startMoving = true;
    }
    else if (direction === 'right') {
      chicken.rotation.z = 3*Math.PI/2;
       if(finalPositions.column === columns - 1 ) return;
       if(lanes[finalPositions.lane].type === 'forest' && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column+1)) return;
       if(!stepStartTimestamp) startMoving = true;
    }
    moves.push(direction);
}

function toScreenPosition(obj, camera)
{
    var vector = new THREE.Vector3();

    var widthHalf = 0.5*renderer.context.canvas.width;
    var heightHalf = 0.5*renderer.context.canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return {
        x: vector.x,
        y: vector.y
    };

};

var prevPosition = 0;

function animate(timestamp) {
    requestAnimationFrame( animate );

    if (!gameStarted) return;
    let originalChickenX = chicken.position.x;

    // Camera motion
    var proj = toScreenPosition(chicken, camera);
    if (proj.y < 0.3*renderer.context.canvas.height)
      camera.position.y = camera.position.y + 8;
    else if (proj.y < 0.4*renderer.context.canvas.height)
        camera.position.y = camera.position.y + 4;
    else if (proj.y < 0.5*renderer.context.canvas.height)
        camera.position.y = camera.position.y + 2;
    else
      camera.position.y = camera.position.y + 1;
    if ((camera.position.y - initialCameraPositionY) % 80 >= 79) {
      addLane();
    }

    if(!previousTimestamp) previousTimestamp = timestamp;
    const delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;


    // Animate cars and trucks and trains moving on the lane
    const aBitBeforeTheBeginingOfLane = -boardWidth*zoom/2 - positionWidth*2*zoom;
    const aBitAfterTheEndOFLane = boardWidth*zoom/2 + positionWidth*2*zoom;
    lanes.forEach(lane => {
        if(lane.type === 'car' || lane.type === 'truck' || lane.type === 'river' || lane.type === 'animal') {
            lane.vehicles.forEach(vehicle => {
                if(lane.direction) {
                    vehicle.position.x = vehicle.position.x < aBitBeforeTheBeginingOfLane ? aBitAfterTheEndOFLane : vehicle.position.x -= lane.speed/16*delta;
                }else{
                    vehicle.position.x = vehicle.position.x > aBitAfterTheEndOFLane ? aBitBeforeTheBeginingOfLane : vehicle.position.x += lane.speed/16*delta;
                }
            });
        }
        if (lane.type === 'animal') {
          lane.vehicles.forEach(vehicle => {
            if (vehicle.position.x >= 714 || vehicle.position.x <= -714) {
              lane.direction = !lane.direction;
              if (!lane.direction) vehicle.rotation.z = Math.PI;
              else vehicle.rotation.z = 0;
            }
          });
        }
        if(lane.type === 'lava') {
          lane.mesh = new Fire();
            // console.log((lane.startTime + timestamp));
            /*if ((lane.startTime + timestamp) % lane.period >= 0 && (lane.startTime + timestamp) % lane.period <= lane.period / 2) {
              lane.mesh = Fire();
            }
            else lane.mesh = NotFire();*/
        }
    });



    // WASHINGTON ROAD: Animate planks and chicken and camera moving on lane
    if (lanes[currentLane].type === 'river') {
      if(lanes[currentLane].direction) {
          chicken.position.x = chicken.position.x < aBitBeforeTheBeginingOfLane ? aBitAfterTheEndOFLane : chicken.position.x -= lanes[currentLane].speed/16*delta;
          prevPosition = prevPosition < aBitBeforeTheBeginingOfLane ? aBitAfterTheEndOFLane : prevPosition -= lanes[currentLane].speed/16*delta;
          if (!gameEnded) camera.position.x = camera.position.x < aBitBeforeTheBeginingOfLane ? aBitAfterTheEndOFLane : camera.position.x -= lanes[currentLane].speed/16*delta;
      }
      else{
          chicken.position.x = chicken.position.x > aBitAfterTheEndOFLane ? aBitBeforeTheBeginingOfLane : chicken.position.x += lanes[currentLane].speed/16*delta;
          prevPosition = prevPosition < aBitBeforeTheBeginingOfLane ? aBitAfterTheEndOFLane : prevPosition += lanes[currentLane].speed/16*delta;
          if (!gameEnded) camera.position.x = camera.position.x < aBitBeforeTheBeginingOfLane ? aBitAfterTheEndOFLane : camera.position.x += lanes[currentLane].speed/16*delta;
      }
      currentColumn = Math.round((chicken.position.x + 672) / 84);
    }
    // WASHINGTON ROAD: added ice lane type with audio handler
    if (lanes[currentLane].type === 'ice') {
      if (!onIce) {
        onIce = true;
        enteredIceTimestamp = timestamp;
        var listener = new THREE.AudioListener();
        camera.add( listener );
        iceSound = new THREE.Audio( listener );
        var iceLoader = new THREE.AudioLoader();
        iceLoader.load( 'sounds/iceCrack.mp3', function( buffer ) {
          iceSound.setBuffer( buffer );
          iceSound.setLoop( false );
          iceSound.setVolume( 0.7 );
          iceSound.play();
        });
       }
       // WASHINGTON ROAD: ice kills you if you are on it for too long
       if (timestamp - enteredIceTimestamp > 5 * 10**3) {
         chicken.rotation.x = Math.PI / 2;
         iceMaterial.color = 0x000000;
         iceMaterial.map = iceTexture2;
			   iceTexture1.dispose();
         gameEnded = true;
         counterFinalDOM.innerHTML = currentLane + coinCount;
         counterFinalDOM.style.visibility = 'visible';
         endDOM.style.visibility = 'visible';
       }
    } else if (onIce) {
      iceSound.stop();
      onIce = false;
    }

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
                // camera.position.y = initialCameraPositionY + currentLane*positionWidth*zoom + moveDeltaDistance;
                chicken.position.y = currentLane*positionWidth*zoom + moveDeltaDistance; // initial chicken position is 0
                chicken.position.z = jumpDeltaDistance;
                break;
            }
            case 'backward': {
                // camera.position.y = initialCameraPositionY + currentLane*positionWidth*zoom - moveDeltaDistance;
                chicken.position.y = currentLane*positionWidth*zoom - moveDeltaDistance;
                chicken.position.z = jumpDeltaDistance;
                break;
            }
            case 'left': {
                if (lanes[currentLane].type == 'river') {
                  chicken.position.x = ((prevPosition+672)/84*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 - moveDeltaDistance;
                  camera.position.x = initialCameraPositionX + ((prevPosition+672)/84*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 - moveDeltaDistance;
                }
                else {
                  chicken.position.x = (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 - moveDeltaDistance;
                  camera.position.x = initialCameraPositionX + (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 - moveDeltaDistance;
                }
                chicken.position.z = jumpDeltaDistance;
                break;
            }
            case 'right': {
              if (lanes[currentLane].type == 'river') {
                chicken.position.x = ((prevPosition+672)/84*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 + moveDeltaDistance;
                camera.position.x = initialCameraPositionX + ((prevPosition+672)/84*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 + moveDeltaDistance;
              }
              else {
                chicken.position.x = (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 + moveDeltaDistance;
                camera.position.x = initialCameraPositionX + (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 + moveDeltaDistance;
              }
              chicken.position.z = jumpDeltaDistance;
              break;
            }
        }
        // Once a step has ended
        // WASHINGTON ROAD: added special handling for the river lane
        if(moveDeltaTime > stepTime) {
            prevPosition = chicken.position.x;
            switch(moves[0]) {
                case 'forward': {
                  if (lanes[currentLane].type === 'river' && lanes[currentLane+1].type !== 'river') {
                    chicken.position.x = 84*currentColumn - 672;
                    camera.position.x = initialCameraPositionX + (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2;
                  }
                    currentLane++;
                    counterDOM.innerHTML = currentLane + coinCount;
                    addLane();
                    break;
                }
                case 'backward': {
                  if (lanes[currentLane].type === 'river' && lanes[currentLane-1].type !== 'river') {
                    chicken.position.x = 84*currentColumn - 672;
                    camera.position.x = initialCameraPositionX + (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2;
                  }
                    currentLane--;
                    counterDOM.innerHTML = currentLane + coinCount;
                    break;
                }
                case 'left': {
                    currentColumn--;
                    counterDOM.innerHTML = currentLane + coinCount;
                    break;
                }
                case 'right': {
                    currentColumn++;
                    counterDOM.innerHTML = currentLane + coinCount;
                    break;
                }
            }
            moves.shift();
            // If more steps are to be taken then restart counter otherwise stop stepping
            stepStartTimestamp = moves.length === 0 ? null : timestamp;
        }
    }

    // Hit test
    if(lanes[currentLane].type === 'car' || lanes[currentLane].type === 'truck' || lanes[currentLane].type === 'animal') {
        const chickenMinX = chicken.position.x - chickenSize*zoom/2;
        const chickenMaxX = chicken.position.x + chickenSize*zoom/2;
        const vehicleLength = { car: 60, truck: 105, animal:60}[lanes[currentLane].type];
        lanes[currentLane].vehicles.forEach(vehicle => {
            const carMinX = vehicle.position.x - vehicleLength*zoom/2;
            const carMaxX = vehicle.position.x + vehicleLength*zoom/2;
            if(chickenMaxX > carMinX && chickenMinX < carMaxX) {
                gameEnded = true;
                chicken.rotation.x = Math.PI / 2;
                counterFinalDOM.innerHTML = currentLane + coinCount;
                counterFinalDOM.style.visibility = 'visible';
                endDOM.style.visibility = 'visible';
            }
        });

        // WASHINGTON ROAD: check for coin collision
        const coinLength = 10;
        let toRemove = [];
        lanes[currentLane].coins.forEach(coin => {
            const coinMinX = coin.position.x - coinLength*zoom/2;
            const coinMaxX = coin.position.x + coinLength*zoom/2;
            if(chickenMaxX > coinMinX && chickenMinX < coinMaxX) {
                var listener = new THREE.AudioListener();
                camera.add( listener );
                washingtonSound = new THREE.Audio( listener );
                var washingtonLoader = new THREE.AudioLoader();
                washingtonLoader.load( 'sounds/coin.wav', function( buffer ) {
                  washingtonSound.setBuffer( buffer );
                  washingtonSound.setLoop( false );
                  washingtonSound.setVolume( 0.5 );
                  washingtonSound.play();
                });
                coinCount = coinCount + 1;
                lanes[currentLane].mesh.remove(coin);
                toRemove.push(coin);
            }
        });
        toRemove.forEach(coin => {
          lanes[currentLane].coins.splice(lanes[currentLane].coins.indexOf(coin), 1);
        });
    }
    // WASHINGTON ROAD: river lane type, handle death accordingly
    if(lanes[currentLane].type === 'river') {
        const chickenMinX = originalChickenX - chickenSize*zoom/2;
        const chickenMaxX = originalChickenX + chickenSize*zoom/2;
        const vehicleLength = 80;
        let inWater = true;
        lanes[currentLane].vehicles.forEach(vehicle => {
            const carMinX = vehicle.position.x - vehicleLength*zoom/2;
            const carMaxX = vehicle.position.x + vehicleLength*zoom/2;
            if(chickenMaxX >= carMinX && chickenMinX <= carMaxX) {
                inWater = false;
            }
        });
        if (inWater || chicken.position.x >= 714 || chickenMinX <= -714) {
            chicken.rotation.y = Math.PI / 2;
            chicken.position.z = 1*zoom;
            gameEnded = true;
            counterFinalDOM.innerHTML = currentLane + coinCount;
            counterFinalDOM.style.visibility = 'visible';
            endDOM.style.visibility = 'visible';
        }
    }

    // every time the camera or objects change position (or every frame)
    camera.updateMatrixWorld(); // make sure the camera matrix is updated
    camera.matrixWorldInverse.getInverse( camera.matrixWorld );
    cameraViewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
    frustum.setFromMatrix( cameraViewProjectionMatrix );
    // WASHINGTON ROAD: user dies if the camera cuts them out of view
    // frustum is now ready to check all the objects you need
    if (!frustum.containsPoint(chicken.position)) {
      chicken.rotation.x = Math.PI / 2;
      gameEnded = true;
      counterFinalDOM.innerHTML = currentLane + coinCount;
      counterFinalDOM.style.visibility = 'visible';
      endDOM.style.visibility = 'visible';
    }

    renderer.render( scene, camera );
}

requestAnimationFrame( animate );
