Game.Map = function(tiles, player){
    this._tiles = tiles;

    this._depth = tiles.length;
    this._width = tiles[0].length;
    this._height = tiles[0][0].length;

    this._fov = [];
    this.setupFov();

    this._entities = {};

    this._items = {};
    
    this._scheduler = new ROT.Scheduler.Speed();
    this._engine = new ROT.Engine(this._scheduler);

    this._explored = new Array(this._depth);
    this._setupExploredArray();
};

$harita = Game.Map.prototype;

$harita.getPlayer = function(){
    return this._player;
}
$harita.getDepth = function(){
    return this._depth;
};
$harita.getWidth = function(){
    return this._width;
};
$harita.getHeight = function(){
    return this._height;
};

$harita.getTile = function(x, y, z){
    
    if(x < 0 || x >= this._width || y < 0 || y >= this._height ||
       z < 0 || z >= this._depth){
        return Game.Tile.nullTile;
    }else{
        return this._tiles[z][x][y] || Game.Tile.nullTile;
    }
};

$harita.dig = function(x, y, z){

    if(this.getTile(x, y, z).isDiggable()){
        this._tiles[z][x][y] = Game.Tile.floorTile;
    }
};

$harita.isEmptyFloor = function(x, y, z){
    return this.getTile(x, y, z) == Game.Tile.floorTile &&
           !this.getEntityAt(x, y, z);
};

$harita.getRandomFloorPosition = function(z){
    var x, y;
    do{
        x = Math.floor(Math.random() * this._width);
        y = Math.floor(Math.random() * this._height);
    } while(!this.isEmptyFloor(x, y, z));
    return {x: x, y: y, z: z};
};
$harita.getEngine = function(){
    return this._engine;
};
$harita.getEntities = function(){
    return this._entities;
};
$harita.getEntityAt = function(x, y, z){
    return this._entities[x + ',' + y + ',' + z];
};
$harita.getEntitiesWithinRadius = function(centerX, centerY, centerZ, radius){
    results = [];

    var leftX = centerX - radius;
    var rightX = centerX + radius;
    var topY = centerY - radius;
    var bottomY = centerY + radius;

    for(var key in this._entities){
        var entity = this._entities[key];
        if(entity.getX() >= leftX &&
           entity.getX() <= rightX &&
           entity.getY() <= bottomY &&
           entity.getY() >= topY &&
           entity.getZ() == centerZ){
            results.push(entity);
        }
    }
    return results;
};
$harita.addEntity = function(entity){
    entity.setMap(this);

    this.updateEntityPosition(entity);

    if(entity.hasMixin('Actor')){
        this._scheduler.add(entity, true);
    }
    if(entity.hasMixin(Game.EntityMixins.PlayerActor)){
        this._player = entity;
    }
};
$harita.addEntityAtRandomPosition = function(entity, z){
    var position = this.getRandomFloorPosition(z);
    entity.setX(position.x);
    entity.setY(position.y);
    entity.setZ(position.z);
    this.addEntity(entity);
};
$harita.removeEntity = function(entity){
    var key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
    if(this._entities[key] == entity){
        delete this._entities[key];
    }    
    if(entity.hasMixin('Actor')){
        this._scheduler.remove(entity);
    }
    if(entity.hasMixin(Game.EntityMixins.PlayerActor)){
        this._player = undefined;
    }
};
$harita.updateEntityPosition = function(entity, oldX, oldY, oldZ){
    if(typeof(oldX) !== "undefined"){
        var oldKey = oldX + ',' + oldY + ',' + oldZ;
        if(this._entities[oldKey] == entity){
            delete this._entities[oldKey];
        }
    }

    if(entity.getX() < 0 || entity.getX() >= this._width ||
       entity.getY() < 0 || entity.getY() >= this._height ||
       entity.getZ() < 0 || entity.getZ() >= this._depth){
        throw new Error('Varligin konumu sinirlar disinda!');
    }

    var key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
    if(this._entities[key]){
        throw new Error('Baska varligin bulundugu konuma yerlestirilemez!');
    }
    this._entities[key] = entity;
};


$harita.setupFov = function(){
    var map = this;
    for(var z = 0; z < this._depth; z++){
        (function(){
            var depth = z;
            map._fov.push(
                new ROT.FOV.DiscreteShadowcasting(function(x, y){
                    return !map.getTile(x, y, depth).isBlockingLight();
                }, {topology: 4})
            );
        })();
    }
};

$harita.getFov = function(depth){
    return this._fov[depth];
};

$harita._setupExploredArray = function(){
    for(var z = 0; z < this._depth; z++){
        this._explored[z] = new Array(this._width);
        for(var x = 0; x < this._width; x++){
            this._explored[z][x] = new Array(this._height);
            for(var y = 0; y < this._height; y++){
                this._explored[z][x][y] = false;
            }
        }
    }
};

$harita.setExplored = function(x, y, z, state){
    if(this.getTile(x, y, z) !== Game.Tile.nullTile){
        this._explored[z][x][y] = state;
    }
};

$harita.isExplored = function(x, y, z){
    if(this.getTile(x, y, z) !== Game.Tile.nullTile){
        return this._explored[z][x][y];
    }
    else{
        return false;
    }
};

$harita.getItemsAt = function(x, y, z){
    return this._items[x + ',' + y + ',' + z];
};

$harita.setItemsAt = function(x, y, z, items){
    var key = x + ',' + y + ',' + z;
    if(items.length === 0){
        if(this._items[key]){
            delete this._items[key];
        }
    }else{
        this._items[key] = items;
    }
};

$harita.addItem = function(x, y, z, item){
    var key = x + ',' + y + ',' + z;
    if(this._items[key]){
        this._items[key].push(item);
    }else{
        this._items[key] = [item];
    }
};

$harita.addItemAtRandomPosition = function(item, z){
    var position = this.getRandomFloorPosition(z);
    this.addItem(position.x, position.y, position.z, item);
};