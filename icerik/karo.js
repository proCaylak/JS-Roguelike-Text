Game.Tile = function(properties){
    properties = properties || {};
    Game.Glyph.call(this, properties);
    this._walkable = properties['walkable'] || false;
    this._diggable = properties['diggable'] || false;
    this._blocksLight = (properties['blocksLight'] !== undefined) ?
                        properties['blocksLight']: true;
    this._description = properties['description'] || '';
};

Game.Tile.extend(Game.Glyph);

var $karo = Game.Tile;

$karo.prototype.isWalkable = function(){
    return this._walkable;
};
$karo.prototype.isDiggable = function(){
    return this._diggable;
};
$karo.prototype.isBlockingLight = function(){
    return this._blocksLight;
};
$karo.prototype.getDescription = function(){
    return this._description;
}


$karo.nullTile = new Game.Tile({description: '(bilinmiyor)'});
$karo.floorTile = new Game.Tile({
    character: '.',
    walkable: true,
    blocksLight: false,
    description: 'mağara zemini'
});
$karo.wallTile = new Game.Tile({
    character: '#',
    foreground: 'goldenrod',
    diggable: true,
    description: 'mağara duvarı'
});
$karo.stairsUpTile = new Game.Tile({
    character: '^',
    foreground: 'white',
    walkable: true,
    blocksLight: false,
    description: 'yukarıya çıkan taş merdiven'
});
$karo.stairsDownTile = new Game.Tile({
    character: 'v',
    foreground: 'white',
    walkable: true,
    blocksLight: false,
    description: 'aşağıya inen taş merdiven'
});
$karo.holeToCavernTile = new Game.Tile({
    character: 'n',
    foreground: 'white',
    walkable: true,
    blocksLight: false,
    description: 'kocaman ve karanlık bir çukur'
});
$karo.waterTile = new Game.Tile({
    character: '≈',
    foreground: 'blue',
    walkable: false,
    blocksLight: false,
    description: 'biraz bulanık su'
});

Game.getNeighborPositions = function(x, y){
    var tiles = [];
    for(var dX = -1; dX < 2; dX++){
        for(var dY = -1; dY < 2; dY++){
            if(dX == 0 && dY == 0){
                continue;
            }
            tiles.push({x: x + dX, y: y + dY});
        }
    }
    return tiles.randomize();
}