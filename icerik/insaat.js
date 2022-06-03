Game.Builder = function(width, height, depth) {
    this._width = width;
    this._height = height;
    this._depth = depth;
    this._tiles = new Array(depth);
    this._regions = new Array(depth);
    for (var z = 0; z < depth; z++) {
        // her katta yeni alan olustur
        this._tiles[z] = this._generateLevel();
        // her kat icindeki alanlara bolge ata
        this._regions[z] = new Array(width);
        for (var x = 0; x < width; x++) {
            this._regions[z][x] = new Array(height);
            // ilk olarak bolgeyi 0 ata
            for (var y = 0; y < height; y++) {
                this._regions[z][x][y] = 0;
            }
        }
    }
    for (var z = 0; z < this._depth; z++) {
        this._setupRegions(z);
    }
    this._connectAllRegions();
};

Game.Builder.prototype.getTiles = function () {
    return this._tiles;
}
Game.Builder.prototype.getDepth = function () {
    return this._depth;
}
Game.Builder.prototype.getWidth = function () {
    return this._width;
}
Game.Builder.prototype.getHeight = function () {
    return this._height;
}

Game.Builder.prototype._generateLevel = function() {
    // bos harita olustur
    var map = new Array(this._width);
    for (var w = 0; w < this._width; w++) {
        map[w] = new Array(this._height);
    }
    // rastgele harita olusturucusunu cagir
    var generator = new ROT.Map.Cellular(this._width, this._height);
    generator.randomize(0.5);
    var totalIterations = 3;
    // olusturucuyu tekrar calistirarak haritadaki gurultuyu azalt
    for (var i = 0; i < totalIterations - 1; i++) {
        generator.create();
    }
    // gurultuyu son bir kez daha azaltip haritayi guncelle
    generator.create(function(x,y,v) {
        if (v === 1) {
            map[x][y] = Game.Tile.floorTile;
        } else {
            map[x][y] = Game.Tile.wallTile;
        }
    });
    return map;
};

Game.Builder.prototype._canFillRegion = function(x, y, z) {
    // karo alan icinde mi?
    if (x < 0 || y < 0 || z < 0 || x >= this._width ||
        y >= this._height || z >= this._depth) {
        return false;
    }
    // karo mevcut olan bir bolgede mi?
    if (this._regions[z][x][y] != 0) {
        return false;
    }
    // karo ustunde yurunulebiliyor mu?
    return this._tiles[z][x][y].isWalkable();
}

Game.Builder.prototype._fillRegion = function(region, x, y, z) {
    var tilesFilled = 1;
    var tiles = [{x:x, y:y}];
    var tile;
    var neighbors;
    // secilen karonun bolgesini guncelle
    this._regions[z][x][y] = region;
    // tum karolarin bolgeleri atanana kadar calis
    while (tiles.length > 0) {
        tile = tiles.pop();
        // secilen karonun komsularini al
        neighbors = Game.getNeighborPositions(tile.x, tile.y);
        // tum komsulari kontrol et ve bolgeye eklenebilenleri siraya koy
        while (neighbors.length > 0) {
            tile = neighbors.pop();
            if (this._canFillRegion(tile.x, tile.y, z)) {
                this._regions[z][tile.x][tile.y] = region;
                tiles.push(tile);
                tilesFilled++;
            }
        }

    }
    return tilesFilled;
}

// belirtilen katta belirtilen bolgedeki tum karolari duvar karosuna donusturur
Game.Builder.prototype._removeRegion = function(region, z) {
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._regions[z][x][y] == region) {
                // bolgeyi temizle ve duvar karosuna donustur
                this._regions[z][x][y] = 0;
                this._tiles[z][x][y] = Game.Tile.wallTile;
            }
        }
    }
}

// belirtilen kattaki bölgeleri ata
Game.Builder.prototype._setupRegions = function(z) {
    var region = 1;
    var tilesFilled;
    // bolge doldurmak icin kullanilabilecek bir karo ara
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._canFillRegion(x, y, z)) {
                // bolgeyi doldurmaya calis
                tilesFilled = this._fillRegion(region, x, y, z);
                // doldurulan bolge cok kucukse kaldir
                if (tilesFilled <= 20) {
                    this._removeRegion(region, z);
                } else {
                    region++;
                }
            }
        }
    }
}

//belirtilen kat ile altindaki kat arasindaki bolge kesisimlerini tespit et
Game.Builder.prototype._findRegionOverlaps = function(z, r1, r2) {
    var matches = [];
    // iki bitisik kattaki ayni x ve y koordinatindaki karolar
    // belirtilen bolgeler icinde ve zemin karolari ise listeye al
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._tiles[z][x][y]  == Game.Tile.floorTile &&
                this._tiles[z+1][x][y] == Game.Tile.floorTile &&
                this._regions[z][x][y] == r1 &&
                this._regions[z+1][x][y] == r2) {
                matches.push({x: x, y: y});
            }
        }
    }
    //secim cesitliligi icin liste karistirilir
    return matches.randomize();
}

//bitisik katlarda kesisen bolgelerde 
//ayni x,y koordinatlarinda bulunan
//karolari merdivenle birbirine bagla
Game.Builder.prototype._connectRegions = function(z, r1, r2) {
    var overlap = this._findRegionOverlaps(z, r1, r2);
    // bolgelerde kesisim yoksa iptal et
    if (overlap.length == 0) {
        return false;
    }
    // kesisim kumesindeki ilk elemani al
    // oradaki noktalardan bitisik katlarda kesisen bolgeleri bagla
    var point = overlap[0];
    this._tiles[z][point.x][point.y] = Game.Tile.stairsDownTile;
    this._tiles[z+1][point.x][point.y] = Game.Tile.stairsUpTile;
    return true;
}

// en tepeden baslayip tum bitisik katlarda kesisen bolgeleri birbirine bagla
Game.Builder.prototype._connectAllRegions = function() {
    for (var z = 0; z < this._depth - 1; z++) {
        // tum karolari kontrol et 
        // bitisik katlarda kesisen ama baglanmamis bolgeler varsa
        // o bolgeleri birbirine baglamaya calis
        // sonucu bir string olarak tut
        var connected = {};
        var key;
        for (var x = 0; x < this._width; x++) {
            for (var y = 0; y < this._height; y++) {
                key = this._regions[z][x][y] + ',' +
                      this._regions[z+1][x][y];
                if (this._tiles[z][x][y] == Game.Tile.floorTile &&
                    this._tiles[z+1][x][y] == Game.Tile.floorTile &&
                    !connected[key]) {
                    //bitisik katlarda kesisen bolgelerde 
                    //her iki karo da zemin ise merdivenle baglamayi dene
                    this._connectRegions(z, this._regions[z][x][y],
                        this._regions[z+1][x][y]);
                    connected[key] = true;
                }
            }
        }
    }
}

