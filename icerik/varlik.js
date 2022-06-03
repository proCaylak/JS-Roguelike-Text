Game.Entity = function(properties){
    properties = properties || {};
    Game.DynamicGlyph.call(this,properties);

    this._name = properties['name'] || '';
    this._x = properties['x'] || 0;
    this._y = properties['y'] || 0;
    this._z = properties['z'] || 0;
    this._map = null;    

    this._attachedMixins = {};

    this._attachedMixinGroups = {}

    var mixins = properties['mixins'] || [];
    for(var i = 0; i < mixins.length; i++){
        for(var key in mixins[i]){
            if(key != 'init' && key != 'name' && !this.hasOwnProperty(key)){
                this[key] = mixins[i][key];
            }
        }
        this._attachedMixins[mixins[i].name] = true;

        if(mixins[i].groupName){
            this._attachedMixinGroups[mixins[i].groupName] = true;
        }

        if(mixins[i].init){
            mixins[i].init.call(this, properties);
        }
    }
    this._alive = true;
    this._speed = properties['speed'] || 1000;
};

Game.Entity.extend(Game.DynamicGlyph);

var $varlik = Game.Entity.prototype;

$varlik.setX = function(x){
    this._x = x;
};
$varlik.setY = function(y){
    this._y = y;
};
$varlik.setZ = function(z){
    this._z = z;
};
$varlik.setMap = function(map){
    this._map = map;
};
$varlik.setSpeed = function(speed){
    this._speed = speed;
};
$varlik.setPosition = function(x, y, z){
    var oldX = this._x;
    var oldY = this._y;
    var oldZ = this._z;

    this._x = x;
    this._y = y;
    this._z = z;

    if(this._map){
        this._map.updateEntityPosition(this, oldX, oldY, oldZ);
    }
};


$varlik.getX = function(){
    return this._x;
};
$varlik.getY = function(){
    return this._y;
};
$varlik.getZ = function(){
    return this._z;
};
$varlik.getMap = function(){
    return this._map;
};
$varlik.getSpeed = function(){
    return this._speed;
};

$varlik.tryMove = function(x, y, z, map){
    var map = this.getMap();

    var tile = map.getTile(x, y, this.getZ());
    var target = map.getEntityAt(x, y, this.getZ());

    if(z < this.getZ()){
        if(tile != Game.Tile.stairsUpTile){
            Game.sendMessage(this, "Yukarı çıkılamıyor!");
        }else{
            Game.sendMessage(this, "%d. kata çıktın", [z+1]);
            this.setPosition(x, y, z);
        }
    }
    else if(z > this.getZ()){
        if(tile === Game.Tile.holeToCavernTile &&
        this.hasMixin(Game.EntityMixins.PlayerActor)){
            this.switchMap(new Game.Map.BossCavern());
        }else if(tile != Game.Tile.stairsDownTile){
            Game.sendMessage(this, "Aşağı inilemiyor!");
        }else{
            this.setPosition(x, y, z);
            Game.sendMessage(this, "%d. kata indin", [z+1]);
        }
    }
    else if(target){
        if(this.hasMixin('Attacker') &&
           (this.hasMixin(Game.EntityMixins.PlayerActor) ||
            target.hasMixin(Game.EntityMixins.PlayerActor))){
            this.attack(target);
            return true;
        }else{
            return false;
        }
    } else if(tile.isWalkable()){
        this.setPosition(x, y, z);

        var items = this.getMap().getItemsAt(x, y, z);
        if(items){
            if(items.length === 1){
                Game.sendMessage(this, "Yerde %s var", [items[0].describe()]);
            }else{
                Game.sendMessage(this, "Yerde birden fazla eşya var.");
            }
        }
        return true;
    } else if(tile.isDiggable()){
        if(this.hasMixin(Game.EntityMixins.PlayerActor)){
            map.dig(x, y, z);
            return true;
        }
        return false;
    }
    return false;
};

$varlik.isAlive = function(){
    return this._alive;
};

$varlik.kill = function(message){
    if(!this._alive){
        return;
    }
    this._alive = false;
    if(message){
        Game.sendMessage(this, message);
    }else{
        Game.sendMessage(this, "Katledildin!");
    }

    if(this.hasMixin(Game.EntityMixins.PlayerActor)){
        this.act();
    }else{
        this.getMap().removeEntity(this);
    }
};

$varlik.switchMap = function(newMap){
    if(newMap === this.getMap()){
        return;
    }
    this.getMap().removeEntity(this);
    this._x = 0;
    this._y = 0;
    this._z = 0;
    newMap.addEntity(this);
};