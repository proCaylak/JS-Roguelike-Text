Game.Map.Cave = function(tiles, player){
    Game.Map.call(this, tiles);

    this.addEntityAtRandomPosition(player, 0);

    for(var z = 0; z < this._depth; z++){
        for(var i = 0; i < 15; i++){
            var entity = Game.EntityRepository.createRandom();
            this.addEntityAtRandomPosition(entity, z);
            if(entity.hasMixin('ExperienceGainer')){
                for(var level = 0; level < z; level++){
                    entity.giveExperience(entity.getNextLevelExperience() - entity.getExperience());
                }
            }
        }
        for(var i = 0; i < 15; i++){
            this.addItemAtRandomPosition(Game.ItemRepository.createRandom(), z);
        }
    }
    var templates = ['hancer', 'kilic', 'asa', 
        'tunik', 'zincir zirh', 'plaka zirh'];
    for(var i = 0; i < templates.length; i++){
        this.addItemAtRandomPosition(Game.ItemRepository.create(templates[i]),
            Math.floor(this._depth * Math.random()));
    }
    var holePosition = this.getRandomFloorPosition(this._depth - 1);
    this._tiles[this._depth - 1][holePosition.x][holePosition.y] = Game.Tile.holeToCavernTile;
};
Game.Map.Cave.extend(Game.Map);