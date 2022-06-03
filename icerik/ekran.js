Game.Screen = {}

$ekran = Game.Screen;

$ekran.startScreen = {
    enter: function(){console.log("Baslangıç ekranına girildi.");},
    exit: function(){console.log("Baslangıç ekranından çıkıldı.");},
    render: function(display){

        display.drawText(1,1, "%c{yellow}Web Tabanlı Roguelike Oyun");
        display.drawText(1,2, "[Enter]'a basarak başla!");
        display.drawText(1,4, "Oyun içinde yardım menüsü için [K] tuşuna basınız.")
    },
    handleInput: function(inputType, inputData){
        if(inputType === 'keydown'){
            if(inputData.keyCode === ROT.VK_RETURN){
                Game.switchScreen($ekran.playScreen);
            }
        }
    }
}

$ekran.playScreen = {    
    _player: null,
    _gameEnded: false,
    _subScreen: null,
    enter: function(){        
        var width = 100;
        var height = 48;
        var depth = 6;
        
        this._player = new Game.Entity(Game.PlayerTemplate);        
        var tiles = new Game.Builder(width, height, depth).getTiles();
        var map = new Game.Map.Cave(tiles, this._player);
        
        map.getEngine().start();
    },
    exit: function(){console.log("Oyun ekranından çıkıldı.");},
    render: function(display){
        if(this._subScreen){
            this._subScreen.render(display);
            return;
        }

        var screenWidth = Game.getScreenWidth();
        var screenHeight = Game.getScreenHeight();

        this.renderTiles(display);

        var messages = this._player.getMessages();
        var messageY = 0;
        for(var i = 0; i < messages.length; i++){
            messageY+= display.drawText(0, messageY,
                '%c{white}%b{black}' + messages[i]);
        }

        var stats = '%c{white}%b{black}';
        stats += vsprintf('Can: %d/%d Seviye: %d Tecrübe Puanı: %d',
                [this._player.getHp(), this._player.getMaxHp(),
                 this._player.getLevel(), this._player.getExperience()]);
        display.drawText(0, screenHeight, stats);
        
        var hungerState = this._player.getHungerState();
        display.drawText(screenWidth - hungerState.length, screenHeight, hungerState);
    },
    getScreenOffsets: function(){
        var topLeftX = Math.max(0, this._player.getX() - (Game.getScreenWidth() / 2));
        topLeftX = Math.min(topLeftX, this._player.getMap().getWidth() - Game.getScreenWidth());

        var topLeftY = Math.max(0, this._player.getY() - (Game.getScreenHeight() / 2));
        topLeftY = Math.min(topLeftY, this._player.getMap().getHeight() - Game.getScreenHeight());
        return{
            x: topLeftX,
            y: topLeftY
        };
    },
    renderTiles: function(display){
        var screenWidth = Game.getScreenWidth();
        var screenHeight = Game.getScreenHeight();
        var offsets = this.getScreenOffsets();
        var topLeftX = offsets.x;
        var topLeftY = offsets.y;
        var visibleCells = {};
        var map = this._player.getMap();
        var currentDepth = this._player.getZ();

        map.getFov(currentDepth).compute(
            this._player.getX(), this._player.getY(),
            this._player.getSightRadius(),
            function(x, y, radius, visibility){
                visibleCells[x + ',' + y] = true;
                map.setExplored(x, y, currentDepth, true);
        });
        for(var x = topLeftX; x < topLeftX + screenWidth; x++){
            for(var y = topLeftY; y < topLeftY + screenHeight; y++){
                if(map.isExplored(x, y, currentDepth)){
                    var glyph = map.getTile(x, y, currentDepth);
                    var foreground = glyph.getForeground();

                    if(visibleCells[x + ',' + y]){
                        var items = map.getItemsAt(x, y, currentDepth);
                        if(items){
                            glyph = items[items.length - 1];
                        }
                        if(map.getEntityAt(x, y, currentDepth)){
                            glyph = map.getEntityAt(x, y, currentDepth);
                        }
                        foreground = glyph.getForeground();
                    }else{
                        foreground = 'darkGray';
                    }
                    display.draw(
                        x - topLeftX,
                        y - topLeftY,
                        glyph.getChar(),
                        foreground,
                        glyph.getBackground());
                }
            }
        }
    },
    handleInput: function(inputType, inputData){
        if(this._gameEnded){
            if(inputType === 'keydown' && inputData.keyCode === ROT.VK_RETURN){
                Game.switchScreen($ekran.loseScreen);
            }
            return;
        }

        if(this._subScreen){
            this._subScreen.handleInput(inputType, inputData);
            return;
        }
        
        if(inputType === 'keydown'){
            if(inputData.keyCode === ROT.VK_LEFT){
                this.move(-1, 0, 0);
            }
            else if(inputData.keyCode === ROT.VK_RIGHT){
                this.move(1, 0, 0);
            }
            else if(inputData.keyCode === ROT.VK_UP){
                this.move(0, -1, 0);
            }
            else if(inputData.keyCode === ROT.VK_DOWN){
                this.move(0, 1, 0);
            }
            else if(inputData.keyCode === ROT.VK_F){
                if(inputData.shiftKey){
                    this.showItemsSubScreen($ekran.dropScreen, this._player.getItems(),
                        'Envanter boş, yere bırakılacak bir şey yok.');
                }else{
                    this.showItemsSubScreen($ekran.inventoryScreen, this._player.getItems(),
                        'Envanter boş.');
                }
                return;
            }                
            else if(inputData.keyCode === ROT.VK_V){
                this.showItemsSubScreen($ekran.eatScreen, this._player.getItems(),
                        'Envanterde yiyecek bir şey yok.');
                return;
            }
            else if(inputData.keyCode === ROT.VK_G){
                if(inputData.shiftKey){
                    this.showItemsSubScreen($ekran.wearScreen, this._player.getItems(),
                        'Envanterde giyecek bir şey yok.');
                }else{
                    this.showItemsSubScreen($ekran.wieldScreen, this._player.getItems(),
                        'Envanterde kuşanılacak bir şey yok.');
                }
                return;
            }
            else if(inputData.keyCode === ROT.VK_C){
                this.showItemsSubScreen($ekran.examineScreen, this._player.getItems(),
                    'Envanterde incelenebilcek hiçbir eşya yok.');
                return;
            }
            else if(inputData.keyCode === ROT.VK_E){
                var items = this._player.getMap().getItemsAt(this._player.getX(), this._player.getY(), this._player.getZ());

                if(items && items.length === 1){
                    var item = items[0];
                    if(this._player.pickupItems([0])){
                        Game.sendMessage(this._player, "Yerden %s aldın.", [item.describe()]);
                    }else{
                        Game.sendMessage(this._player, "Envanter dolu. Hiçbir şey alınmadı.");
                    }
                }else{
                    this.showItemsSubScreen($ekran.pickupScreen, items,
                        'Yerden alınacak eşya yok');
                }
            }
            else{
                return;
            }
            this._player.getMap().getEngine().unlock();
        } else if(inputType === 'keypress'){
            var keyChar = String.fromCharCode(inputData.charCode);
            if(keyChar === 'h'){
                this.move(0, 0, 1);
            }else if(keyChar === 'y'){                
                this.move(0, 0, -1);
            }else if(keyChar === 'b'){
                var offsets = this.getScreenOffsets();
                $ekran.lookScreen.setup(this._player,
                    this._player.getX(), this._player.getY(),
                    offsets.x, offsets.y);
                this.setSubScreen($ekran.lookScreen);
                return;
            }else if(keyChar === 'k'){
                this.setSubScreen($ekran.helpScreen);
            }else{
                return;
            }
            this._player.getMap().getEngine().unlock();
        }
    },
    move: function(dX, dY, dZ){
        var newX = this._player.getX() + dX;
        var newY = this._player.getY() + dY;
        var newZ = this._player.getZ() + dZ;

        this._player.tryMove(newX, newY, newZ, this._player.getMap());
    },
    setGameEnded: function(gameEnded){
        this._gameEnded = gameEnded;
    },
    setSubScreen: function(subScreen){
        this._subScreen = subScreen;
        Game.refresh();
    },
    showItemsSubScreen: function(subScreen, items, emptyMessage){
        if(items && subScreen.setup(this._player, items) > 0){
            this.setSubScreen(subScreen);
        }else{
            Game.sendMessage(this._player, emptyMessage);
            Game.refresh();
        }
    }
};


$ekran.winScreen = {
    enter: function(){console.log("Kazanma ekranına girildi.");},
    exit: function(){console.log("Kazanma ekranından çıkıldı.");},
    render: function(display){
        for(var i=0; i<22; i++){
            var r = Math.round(Math.random()*255);
            var g = Math.round(Math.random()*255);
            var b = Math.round(Math.random()*255);
            var background = ROT.Color.toRGB([r, g, b]);
            display.drawText(2, i+1, "%b{" + background + "}Kazandın! (^_^)");
        }        
    },
    handleInput: function(inputType, inputData){
    }
};


$ekran.loseScreen = {
    enter: function(){console.log("Kaybetme ekranına girildi.");},
    exit: function(){console.log("Kaybetme ekranından çıkıldı.");},
    render: function(display){
        for(var i=0; i<22; i++){
            display.drawText(2, i+1, "%b{red}Kaybettin! (T_T)");
        }       
    },
    handleInput: function(inputType, inputData){
    }
};

$ekran.ItemListScreen = function(template){
    this._caption = template['caption'];
    this._okFunction = template['ok'];

    this._isAcceptableFunction = template['isAcceptable'] || function(x){return x;}

    this._canSelectItem = template['canSelect'];
    this._canSelectMultipleItems = template['canSelectMultipleItems'];
    this._hasNoItemOption = template['hasNoItemOption'];
};

$ekran.ItemListScreen.prototype.setup = function(player, items){
    this._player = player;

    var count = 0;
    var that = this;

    this._items = items.map(function(item){
        if(that._isAcceptableFunction(item)){
            count++;
            return item;
        }else{
            return null;
        }
    });
    this._selectedIndices = {};
    return count;
};

$ekran.ItemListScreen.prototype.render = function(display){
    var letters = 'qwerasdfzxcvtyughjbnmopkl';

    display.drawText(0, 0, this._caption);
    if(this._hasNoItemOption){
        display.drawText(0, 1, '0 - eşya yok');
    }
    var row = 0;
    for(var i = 0; i < this._items.length; i++){
        if(this._items[i]){
            var letter = letters.substring(i, i+1);
            var selectionState = (this._canSelectItem && this._canSelectMultipleItems && this._selectedIndices[i]) ? '+' : '-';

            var suffix = '';
            if(this._items[i] === this._player.getArmor()){
                suffix = ' (mevcut giyilen)';
            }else if(this._items[i] === this._player.getWeapon()){
                suffix = ' (mevcut kuşanılan)';
            }

            display.drawText(0, 2 + row, letter + ' ' + selectionState + ' ' + this._items[i].describe() + suffix);
            row++;
        }
    }
};

$ekran.ItemListScreen.prototype.executeOkFunction = function(){
    var selectedItems = {};
    for(var key in this._selectedIndices){
        selectedItems[key] = this._items[key];
    }

    $ekran.playScreen.setSubScreen(undefined);

    if(this._okFunction(selectedItems)){
        this._player.getMap().getEngine().unlock();
    }
};

$ekran.ItemListScreen.prototype.handleInput = function(inputType, inputData){
    if(inputType === 'keydown'){
        // ESC'ye veya hicbir esya secili degilken ENTER'a basilinca 
        // dogrudan iptal edip cikis yap
        if(inputData.keyCode === ROT.VK_ESCAPE ||
            (inputData.keyCode === ROT.VK_RETURN && 
                (!this._canSelectItem || Object.keys(this._selectedIndices).length === 0))){
            $ekran.playScreen.setSubScreen(undefined);

        } else if(inputData.keyCode === ROT.VK_RETURN){
            this.executeOkFunction();

        } else if(this._canSelectItem && this._hasNoItemOption && inputData.keyCode === ROT.VK_0){
            this._selectedIndices = {};
            this.executeOkFunction();

        } else if(this._canSelectItem && 
                  inputData.keyCode >= ROT.VK_A && 
                  inputData.keyCode <= ROT.VK_Z &&
                  inputData.keyCode !== ROT.VK_I){
            var index = [ROT.VK_Q,ROT.VK_W,ROT.VK_E,ROT.VK_R,ROT.VK_A,
                         ROT.VK_S,ROT.VK_D,ROT.VK_F,ROT.VK_Z,ROT.VK_X,
                         ROT.VK_C,ROT.VK_V,ROT.VK_T,ROT.VK_Y,ROT.VK_U,
                         ROT.VK_G,ROT.VK_H,ROT.VK_J,ROT.VK_B,ROT.VK_N,
                         ROT.VK_M,ROT.VK_O,ROT.VK_P,ROT.VK_K,ROT.VK_L].indexOf(inputData.keyCode);

            if(this._items[index]){

                if(this._canSelectMultipleItems){
                    if(this._selectedIndices[index]){
                        delete this._selectedIndices[index];
                    } else{
                        this._selectedIndices[index] = true;
                    }

                    Game.refresh();
                } else{
                    this._selectedIndices[index] = true;
                    this.executeOkFunction();
                }
            }
        }
    }
};

$ekran.inventoryScreen = new $ekran.ItemListScreen({
    caption: 'Envanter',
    canSelect: false
});

$ekran.pickupScreen = new $ekran.ItemListScreen({
    caption: 'Yerden almak istediğin eşyayı seç:',
    canSelect: true,
    canSelectMultipleItems: true,
    ok: function(selectedItems){
        if(!this._player.pickupItems(Object.keys(selectedItems))){
            Game.sendMessage(this._player, "Envanter dolu! Bazı eşyalar alınmadı.");
        }
        return true;
    }
});

$ekran.dropScreen = new $ekran.ItemListScreen({
    caption: 'Yere bırakmak istediğin eşyayı seç:',
    canSelect: true,
    canSelectMultipleItems: false,
    ok: function(selectedItems){
        this._player.dropItem(Object.keys(selectedItems)[0]);
        return true;
    }
});

$ekran.eatScreen = new $ekran.ItemListScreen({
    caption: 'Yemek istediğin şeyi seç:',
    canSelect: true,
    canSelectMultipleItems: false,
    isAcceptable: function(item){
        return item && item.hasMixin('Edible');
    },
    ok: function(selectedItems){
        var key = Object.keys(selectedItems)[0];
        var item = selectedItems[key];
        Game.sendMessage(this._player, '%s yedin.', [item.describe()]);
        item.eat(this._player);
        if(!item.hasRemainingConsumptions()){
            this._player.removeItem(key);
        }
        return true;
    }
});

$ekran.wieldScreen = new $ekran.ItemListScreen({
    caption: 'Kuşanmak istediğin eşyayı seç:',
    canSelect: true,
    canSelectMultipleItems: false,
    hasNoItemOption: true,
    isAcceptable: function(item){
        return item && item.hasMixin('Equippable') && item.isWieldable();
    },
    ok: function(selectedItems){
        var keys = Object.keys(selectedItems);
        if(keys.length === 0){
            this._player.unwield();
            Game.sendMessage(this._player, 'Silahsızsın.');
        }else{
            var item = selectedItems[keys[0]];
            this._player.unequip(item);
            this._player.wield(item);
            Game.sendMessage(this._player, "%s kuşandın.", [item.describe()]);
        }
        return true;
    }
});

$ekran.wearScreen = new $ekran.ItemListScreen({
    caption: 'Giymek istediğin eşyayı seç:',
    canSelect: true,
    canSelectMultipleItems: false,
    hasNoItemOption: true,
    isAcceptable: function(item){
        return item && item.hasMixin('Equippable') && item.isWearable();
    },
    ok: function(selectedItems){
        var keys = Object.keys(selectedItems);
        if(keys.length === 0){
            this._player.takeOff();
            Game.sendMessage(this._player, 'Üzerinde kıyafet yok.');
        }else{
            var item = selectedItems[keys[0]];
            this._player.takeOff(item);
            this._player.wear(item);
            Game.sendMessage(this._player, "%s giydin.", [item.describe()]);
        }
        return true;
    }
});

$ekran.gainStatScreen = {
    setup: function(entity){
        this._entity = entity;
        this._options = entity.getStatOptions();
    },
    render: function(display){
        var letters = 'qwerasdfzxcvtyughjbnmopkl';
        display.drawText(0, 0, 'Yükseltilecek istatistiği seç: ');

        for(var i = 0; i < this._options.length; i++){
            display.drawText(0, 2 + i,
                letters.substring(i, i + 1) + ' - ' + this._options[i][0]);
        }

        display.drawText(0, 4 + this._options.length,
            "Kalan puan: " + this._entity.getStatPoints());
    },
    handleInput: function(inputType, inputData){
        if(inputType === "keydown"){
            if(inputData.keyCode >= ROT.VK_A && 
                inputData.keyCode <= ROT.VK_Z &&
                inputData.keyCode !== ROT.VK_I){
                
                var index = [ROT.VK_Q,ROT.VK_W,ROT.VK_E,ROT.VK_R,ROT.VK_A,
                            ROT.VK_S,ROT.VK_D,ROT.VK_F,ROT.VK_Z,ROT.VK_X,
                            ROT.VK_C,ROT.VK_V,ROT.VK_T,ROT.VK_Y,ROT.VK_U,
                            ROT.VK_G,ROT.VK_H,ROT.VK_J,ROT.VK_B,ROT.VK_N,
                            ROT.VK_M,ROT.VK_O,ROT.VK_P,ROT.VK_K,ROT.VK_L].indexOf(inputData.keyCode);
                
                if(this._options[index]){                    
                    this._options[index][1].call(this._entity);
                    this._entity.setStatPoints(this._entity.getStatPoints() - 1);
                    if(this._entity.getStatPoints() == 0){
                        $ekran.playScreen.setSubScreen(undefined);
                    }else{
                        Game.refresh();
                    }
                }
            }
        }
    }
};

$ekran.examineScreen = new $ekran.ItemListScreen({
    caption: 'İncelemek istediğin eşyayı seç',
    canSelect: true,
    canSelectMultipleItems: false,    
    ok: function(selectedItems){
        var keys = Object.keys(selectedItems);
        if(keys.length > 0){
            var item = selectedItems[keys[0]];
            Game.sendMessage(this._player, "Eşya: %s (%s)",
            [
                item.describe(),
                item.details()
            ]);
        }
        return true;
    }
});

$ekran.TargetBasedScreen = function(template){
    template = template || {};
    this._isAcceptableFunction = template['okFunction'] || function(x, y){
        return false;
    };

    this._captionFunction = template['captionFunction'] || function(x, y){
        return '';
    };
};

var $hedef_ekran = $ekran.TargetBasedScreen.prototype;

$hedef_ekran.setup = function(player, startX, startY, offsetX, offsetY){
    this._player = player;

    this._startX = startX - offsetX;
    this._startY = startY - offsetY;

    this._cursorX = this._startX;
    this._cursorY = this._startY;

    this._offsetX = offsetX;
    this._offsetY = offsetY;

    var visibleCells = {};
    this._player.getMap().getFov(this._player.getZ()).compute(
        this._player.getX(), this._player.getY(),
        this._player.getSightRadius(),
        function(x, y, radius, visibility){
            visibleCells[x + ',' + y] = true;
        });
    this._visibleCells = visibleCells;
};

$hedef_ekran.render = function(display){
    $ekran.playScreen.renderTiles.call($ekran.playScreen, display);

    var points = Game.Geometry.getLine(this._startX, this._startY, this._cursorX, this._cursorY);

    for(var i = 0, l = points.length; i < l; i++){
        display.drawText(points[i].x, points[i].y, '%c{magenta}*');
    }

    display.drawText(0, Game.getScreenHeight() - 1, this._captionFunction(this._cursorX + this._offsetX, this._cursorY + this._offsetY));
};

$hedef_ekran.handleInput = function(inputType, inputData){
    if(inputType === 'keydown'){
        if(inputData.keyCode === ROT.VK_LEFT){
            this.moveCursor(-1, 0);
        }else if(inputData.keyCode === ROT.VK_RIGHT){
            this.moveCursor(1, 0);
        }else if(inputData.keyCode === ROT.VK_UP){
            this.moveCursor(0, -1);
        }else if(inputData.keyCode === ROT.VK_DOWN){
            this.moveCursor(0, 1);
        }else if(inputData.keyCode === ROT.VK_ESCAPE){
            $ekran.playScreen.setSubScreen(undefined);
        }else if(inputData.keyCode === ROT.VK_RETURN){
            this.executeOkFunction();
        }
    }
    Game.refresh();
};

$hedef_ekran.moveCursor = function(dx, dy){
    this._cursorX = Math.max(0, Math.min(this._cursorX + dx, Game.getScreenWidth()));
    this._cursorY = Math.max(0, Math.min(this._cursorY + dy, Game.getScreenHeight() - 1));
};

$hedef_ekran.executeOkFunction = function(){
    Game.Screen.playScreen.setSubScreen(undefined);
    if (this._okFunction(this._cursorX + this._offsetX, this._cursorY + this._offsetY)) {
        this._player.getMap().getEngine().unlock();
    }
};

$ekran.lookScreen = new $ekran.TargetBasedScreen({
    captionFunction: function(x, y){
        var z = this._player.getZ();
        var map = this._player.getMap();

        if(map.isExplored(x, y, z)){
            if(this._visibleCells[x + ',' + y]){
                var items = map.getItemsAt(x, y, z);
                
                if(items){
                    var item = items[items.length - 1];
                    return String.format('%s - %s (%s)',
                        item.getRepresentation(),
                        item.describe(),
                        item.details());
                }
                else if(map.getEntityAt(x, y, z)){
                    var entity = map.getEntityAt(x, y, z);
                    return String.format('%s - %s (%s)',
                        entity.getRepresentation(),
                        entity.describe(),
                        entity.details());
                }
            }
            return String.format('%s - %s',
                map.getTile(x, y, z).getRepresentation(),
                map.getTile(x, y, z).getDescription());              
        }else{
            return String.format('%s - %s',
                Game.Tile.nullTile.getRepresentation(),
                Game.Tile.nullTile.getDescription());
        }
    }
});

$ekran.helpScreen = {
    render: function(display){
        var text = 'Web Tabanlı Roguelike Oyun hakkında';
        var border = '------------------------------------';
        var y = 0;
        display.drawText(Game.getScreenWidth() / 2 - text.length / 2, y++, text);
        display.drawText(Game.getScreenWidth() / 2 - border.length / 2, y++, border);
        display.drawText(0, y++, 'Mağaranın birinde madencilik yaparken gizemli bir şekilde yolunu kaybettin.');
        display.drawText(0, y++, 'Bir çıkış yolunu bulmaya çalışırken ayakların kaydı ve derin bir çukurdan düştün.');
        display.drawText(0, y++, 'Bilincin yavaş yavaş yerine gelirken bir ses duydun:');
        display.drawText(0, y++, "%c{blue}%b{white}Gulyabani'yi bul ve onu yok et.");
        y += 2;
        display.drawText(0, y++, '[↑][↓][←][→] Hareket et/ Saldır');
        display.drawText(0, y++, '[Y] Yukarı çık | [H] Aşağı in');
        display.drawText(0, y++, '[E] Yerden eşya al');
        display.drawText(0, y++, '[F] Envanteri aç | [SHIFT]+[F] Envanterden eşya bırak');
        display.drawText(0, y++, '[V] Envanterden yiyecek ye');
        display.drawText(0, y++, '[G] Envanterden bir silahı kuşan | [SHIFT]+[G] Envanterden bir kıyafet giy');
        display.drawText(0, y++, '[C] Envanterdeki bir eşyayı incele');
        display.drawText(0, y++, '[B] Etrafındaki yerlere bak');
        display.drawText(0, y++, '[K] Bu yardım sayfasını aç');
        y += 2;
        text = '--- herhangi bir tuşa basarak devam et ---';
        display.drawText(Game.getScreenWidth() / 2 - text.length / 2, y++, text);
    },
    handleInput: function(inputType, inputData){
        if(inputType === 'keypress'){
            $ekran.playScreen.setSubScreen(undefined);
        }
    }
};