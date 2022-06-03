Game.EntityMixins = {};

$varlik_ozellik = Game.EntityMixins;

$varlik_ozellik.Sight = {
    name: 'Sight',
    groupName: 'Sight',
    init: function(template){
        this._sightRadius = template['sightRadius'] || 5;
    },
    getSightRadius: function(){
        return this._sightRadius;
    },
    increaseSightRadius: function(value){
        value = value || 1;
        this._sightRadius += value;
        Game.sendMessage(this, "Görüş mesafen arttı.");
    },
    canSee: function(entity){
        if(!entity || this._map !== entity.getMap() || this._z !== entity.getZ()){
            return false;
        }
        var otherX = entity.getX();
        var otherY = entity.getY();

        if((otherX - this._x) * (otherX - this._x) +
           (otherY - this._y) * (otherY - this._y) > 
           this._sightRadius * this._sightRadius){
            return false;
        }

        var found = false;
        this.getMap().getFov(this.getZ()).compute(
            this.getX(), this.getY(), this.getSightRadius(),
            function(x, y, radius, visibility){
                if(x === otherX && y === otherY){
                    found = true;
                }
            });
        return found;
    }
};

$varlik_ozellik.InventoryHolder = {
    name:'InventoryHolder',
    init: function(template){
        var inventorySlots = template['inventorySlots'] || 10;

        this._items = new Array(inventorySlots);
    },
    getItems: function(){
        return this._items;
    },
    getItem: function(i){
        return this._items[i];
    },
    addItem: function(item){
        for(var i = 0; i < this._items.length; i++){
            if(!this._items[i]){
                this._items[i] = item;
                return true;
            }
        }
        return false;
    },
    removeItem: function(i){
        if(this._items[i] && this.hasMixin($varlik_ozellik.Equipper)){
            this.unequip(this._items[i]);
        }
        this._items[i] = null;
    },
    canAddItem: function(){
        for(var i = 0; i < this._items.length; i++){
            if(!this._items[i]){                
                return true;
            }
        }
        return false;
    },
    pickupItems: function(indices){
        var mapItems = this._map.getItemsAt(this.getX(), this.getY(), this.getZ());
        var added = 0;
        for(var i = 0; i < indices.length; i++){
            if(this.addItem(mapItems[indices[i] - added])){
                mapItems.splice(indices[i] - added, 1);
                added++;
            }else{
                break;
            }
        }
        this._map.setItemsAt(this.getX(), this.getY(), this.getZ(), mapItems);
        return added === indices.length;
    },
    dropItem: function(i){
        if(this._items[i]){
            if(this._map){
                this._map.addItem(this.getX(), this.getY(), this.getZ(), this._items[i]);
            }
            this.removeItem(i);
        }
    }
};

$varlik_ozellik.PlayerActor = {
    name:'PlayerActor',
    groupName:'Actor',
    act: function(){
        if(this._acting){
            return;
        }
        this._acting = true;
        this.addTurnHunger();

        if(!this.isAlive()){
            Game.Screen.playScreen.setGameEnded(true);

            Game.sendMessage(this, 'Katledildin. [Enter] tusuna basarak devam et.');
        }

        Game.refresh();
        this.getMap().getEngine().lock();
        this.clearMessages();
        this._acting = false;
    }
};

$varlik_ozellik.TaskActor = {
    name: 'TaskActor',
    groupName: 'Actor',
    init: function(template){
        this._tasks = template['tasks'] || ['wander'];
    },
    act: function(){
        for(var i = 0; i < this._tasks.length; i++){
            if(this.canDoTask(this._tasks[i])){
                this[this._tasks[i]]();
                return;
            }
        }
    },
    canDoTask: function(task){
        if(task === 'hunt'){
            return this.hasMixin('Sight') && this.canSee(this.getMap().getPlayer());            
        }else if(task === 'wander'){
            return true;
        }else{
            throw new Error('Tanımlanamayan ' + task + ' görevi yapılmaya çalışıldı.');
        }
    },
    hunt: function(){
        var player = this.getMap().getPlayer();
        var offsets = Math.abs(player.getX() - this.getX()) +
            Math.abs(player.getY() - this.getY());
        
        if(offsets === 1){
            if(this.hasMixin('Attacker')){
                this.attack(player);
                return;
            }
        }

        var source = this;
        var z = source.getZ();
        var path = new ROT.Path.AStar(player.getX(), player.getY(), function(x,y){
            var entity = source.getMap().getEntityAt(x, y, z);
            if(entity && entity !== player && entity !== source){
                return false;
            }
            return source.getMap().getTile(x, y, z).isWalkable();
        }, {topology: 4});

        var count = 0;
        path.compute(source.getX(), source.getY(), function(x, y){
            if(count == 1){
                source.tryMove(x, y, z);
            }
            count++;
        });
    },
    wander: function(){
        var moveOffset = (Math.round(Math.random()) === 1) ? 1 : -1;

        if(Math.round(Math.random()) === 1){
            this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
        }else{
            this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
        }
    }
};

$varlik_ozellik.BossActor = Game.extend(Game.EntityMixins.TaskActor, {
    init: function(template){
        $varlik_ozellik.TaskActor.init.call(this, Game.extend(template, {
            'tasks':['goAllIn', 'summonSoldier', 'hunt', 'wander']
        }));
        this._goingAllIn = false;
        this._summonChance = 10;
    },
    canDoTask: function(task){
        if(task === 'goAllIn'){
            return this.getHp() <= 20 && !this._goingAllIn;
        }else if(task === 'summonSoldier'){
            return Math.round(Math.random() * 100) <= this._summonChance;
        }else{
            return $varlik_ozellik.TaskActor.canDoTask.call(this, task);
        }
    },
    goAllIn: function(){
        this._goingAllIn = true;
        this._summonChance = 15;
        this.increaseAttackValue(5);
        
        Game.sendMessageNearby(this.getMap(), this.getX(), this.getY(), this.getZ(),
                        '%c{white}%b{red}Acele etme, sadece birimiz canlı çıkacak.');
    },
    summonSoldier: function(){
        var xOffset = Math.floor(Math.random() * 3) - 1;
        var yOffset = Math.floor(Math.random() * 3) - 1;
        if(!this.getMap().isEmptyFloor(this.getX() + xOffset, this.getY() + yOffset,
            this.getZ())){
                return;
        }
        var summoned = Game.EntityRepository.create('asker cuce');
        summoned.setX(this.getX() + xOffset);
        summoned.setY(this.getY() + yOffset);
        summoned.setZ(this.getZ());
        this.getMap().addEntity(summoned);
    },
    listeners:{
        onDeath: function(attacker){
            Game.switchScreen(Game.Screen.winScreen);
        }
    }
});

$varlik_ozellik.FungusActor = {
    name:'FungusActor',
    groupName:'Actor',
    init: function(){
        this._growthsRemaining = 5;
    },
    act: function(){
        if(this._growthsRemaining > 0){
            if(Math.random() <= 0.02){
                var xOffset = Math.floor(Math.random() * 3) - 1;
                var yOffset = Math.floor(Math.random() * 3) - 1;

                if(xOffset != 0 || yOffset != 0){

                    if(this.getMap().isEmptyFloor(this.getX() + xOffset,
                                                  this.getY() + yOffset,
                                                  this.getZ())){
                        var entity = Game.EntityRepository.create('mantar');
                        entity.setPosition(this.getX() + xOffset,
                                           this.getY() + yOffset,
                                           this.getZ());
                        this.getMap().addEntity(entity);
                        this._growthsRemaining--;

                        Game.sendMessageNearby(this.getMap(),
                            entity.getX(), entity.getY(), entity.getZ(),
                            'Mantarlar yayılıyor!');
                    }
                }
            }
        }
    }
};

$varlik_ozellik.Attacker = {
    name:'Attacker',
    groupName:'Attacker',
    init: function(template){
        this._attackValue = template['attackValue'] || 1;
    },
    getAttackValue: function(){
        var modifier = 0;

        if(this.hasMixin($varlik_ozellik.Equipper)){
            if(this.getWeapon()){
                modifier += this.getWeapon().getAttackValue();
            }
            if(this.getArmor()){
                modifier += this.getArmor().getAttackValue();
            }
        }
        return this._attackValue + modifier;
    },
    increaseAttackValue: function(value){
        value = value || 2;

        this._attackValue += value;
        Game.sendMessage(this, "Saldırı gücün arttı.");
    },
    attack: function(target){
        if(target.hasMixin('Destructible')){
            var attack = this.getAttackValue();
            var defense = target.getDefenseValue();
            var max = Math.max(0, attack - defense);
            var damage = 1 + Math.floor(Math.random() * max);

            Game.sendMessage(this, '%s hedefine %d hasar verdin!',
                [target.getName(), damage]);
            Game.sendMessage(target, '%s tarafından %d hasar aldın!',
                [this.getName(), damage]);

            target.takeDamage(this, damage);
        }
    },
    listeners:{
        details: function(){
            return [{key: 'saldırı', value: this.getAttackValue()}];
        }
    }
};

$varlik_ozellik.Destructible = {
    name:'Destructible',
    init: function(template){
        this._maxHp = template['maxHp'] || 10;
        this._hp = template['hp'] || this._maxHp;
        this._defenseValue = template['defenseValue'] || 0;
    },
    getHp: function(){
        return this._hp;
    },
    getMaxHp: function(){
        return this._maxHp;
    },
    setHp: function(hp){
        this._hp = hp;
    },
    getDefenseValue: function(){
        var modifier = 0;

        if(this.hasMixin($varlik_ozellik.Equipper)){
            if(this.getWeapon()){
                modifier += this.getWeapon().getDefenseValue();
            }
            if(this.getArmor()){
                modifier += this.getArmor().getDefenseValue();
            }
        }
        return this._defenseValue + modifier;
    },
    increaseDefenseValue: function(value){
        value = value || 2;

        this._defenseValue += value;
        Game.sendMessage(this, "Savunman arttı.");
    },
    increaseMaxHp: function(value){
        value = value || 2;

        this._maxHp += value;
        this._hp += value;
        Game.sendMessage(this, "Canın arttı.");
    },
    takeDamage: function(attacker, damage){
        this._hp -= damage;

        if(this._hp <= 0){
            this.setHp(0);
            Game.sendMessage(attacker, '%s hedefini katlettin!', [this.getName()]);
            this.raiseEvent('onDeath', attacker);
            attacker.raiseEvent('onKill', this);
            this.kill();
        }
    },
    listeners:{
        onGainLevel: function(){
            this.setHp(this.getMaxHp());
        },
        details: function(){
            return[
                {key: 'savunma', value: this.getDefenseValue()},
                {key: 'can', value: this.getHp()}
            ];
        }
    }
};

$varlik_ozellik.MessageRecipient = {
    name: 'MessageRecipient',
    init: function(template){
        this._messages = [];
    },
    receiveMessage: function(message){
        this._messages.push(message);
    },
    getMessages: function(){
        return this._messages;
    },
    clearMessages: function(){
        this._messages = [];
    }
};

$varlik_ozellik.FoodConsumer = {
    name: 'FoodConsumer',
    init: function(template){
        this._maxFullness = template['maxFullness'] || 1000;
        this._fullness = template['fullness'] || (this._maxFullness / 2);
        this._fullnessDepletionRate = template['fullnessDepletionRate'] || 1;
    },
    addTurnHunger: function(){
        this.modifyFullnessBy(-this._fullnessDepletionRate);
    },
    modifyFullnessBy: function(points){
        this._fullness = this._fullness + points;
        if(this._fullness <= 0){
            this.kill("Açlıktan öldun!");
        }else if(this._fullness > this._maxFullness){
            this.kill("Aşırı yemekten boğuldun ve öldün!");
        }
    },
    getHungerState: function(){

        var perPercent = this._maxFullness / 100;
        if(this._fullness <= perPercent * 5){
            return '%c{red}%b{white}Açlıktan ölmek üzere';
        }else if(this._fullness <= perPercent * 30){
            return 'Aç';
        }else if(this._fullness >= perPercent * 90){
            return 'Aşırı Tok';
        }else if(this._fullness >= perPercent * 70){
            return 'Tok';
        }else{
            return 'Aç değil';
        }
    }
};

$varlik_ozellik.CorpseDropper = {
    name: 'CorpseDropper',
    init: function(template){
        this._corpseDropRate = template['corpseDropRate'] || 100;
    },
    listeners:{
        onDeath: function(attacker){
            if(Math.round(Math.random() * 100) <= this._corpseDropRate){
                this._map.addItem(this.getX(), this.getY(), this.getZ(),
                    Game.ItemRepository.create('ceset',{
                        name: this._name + ' cesedi',
                        foreground: this._foreground
                    }));
            }
        }
    }
};

$varlik_ozellik.Equipper = {
    name: 'Equipper',
    init: function(template) {
        this._weapon = null;
        this._armor = null;
    },
    wield: function(item) {
        this._weapon = item;
    },
    unwield: function() {
        this._weapon = null;
    },
    wear: function(item) {
        this._armor = item;
    },
    takeOff: function() {
        this._armor = null;
    },
    getWeapon: function() {
        return this._weapon;
    },
    getArmor: function() {
        return this._armor;
    },
    unequip: function(item) {        
        if (this._weapon === item) {
            this.unwield();
        }
        if (this._armor === item) {
            this.takeOff();
        }
    }
};

$varlik_ozellik.ExperienceGainer = {
    name:'ExperienceGainer',
    init: function(template){
        this._level = template['level'] || 1;
        this._experience = template['experience'] || 0;
        this._statPointsPerLevel = template['statPointsPerLevel'] || 1;
        this._statPoints = 0;
        this._statOptions = [];

        if(this.hasMixin('Attacker')){
            this._statOptions.push(['Saldırı gücünü artır.', this.increaseAttackValue]);
        }
        if(this.hasMixin('Destructible')){
            this._statOptions.push(['Savunmayı artır.', this.increaseDefenseValue]);
            this._statOptions.push(['Canı artır.', this.increaseMaxHp]);
        }
        if(this.hasMixin('Sight')){
            this._statOptions.push(['Görüş mesafesini artır.', this.increaseSightRadius]);
        }
    },
    getLevel: function(){
        return this._level;
    },
    getExperience: function(){
        return this._experience;
    },
    getNextLevelExperience: function(){
        return (this._level * this._level) * 10;
    },
    getStatPoints: function(){
        return this._statPoints;
    },
    getStatOptions: function(){
        return this._statOptions;
    },
    setStatPoints: function(statPoints){
        this._statPoints = statPoints;
    },
    giveExperience: function(points){
        var statPointsGained = 0;
        var levelsGained = 0;

        while(points > 0){
            if(this._experience + points >= this.getNextLevelExperience()){
                var usedPoints = this.getNextLevelExperience() - this._experience;
                points -= usedPoints;
                this._experience += usedPoints;
                this._level++;
                levelsGained++;
                this._statPoints += this._statPointsPerLevel;
                statPointsGained += this._statPointsPerLevel;
            }else{
                this._experience += points;
                points = 0;
            }
        }
        if(levelsGained > 0){
            Game.sendMessage(this, "%d. seviyeye ulaştın.", [this._level]);
            this.raiseEvent('onGainLevel');
        }
    },
    listeners:{
        onKill: function(victim){
            var exp = victim.getMaxHp() + victim.getDefenseValue();
            if(victim.hasMixin('Attacker')){
                exp += victim.getAttackValue();
            }
            if(victim.hasMixin('ExperienceGainer')){
                exp -= (this.getLevel() - victim.getLevel()) * 3;
            }
            if(exp > 0){
                this.giveExperience(exp);
            }
        },
        details: function(){
            return [{key: 'seviye', value: this.getLevel()}];
        }
    }
};

$varlik_ozellik.RandomStatGainer = {
    name: 'RandomStatGainer',
    groupName: 'StatGainer',
    listeners:{
        onGainLevel: function(){
            var statOptions = this.getStatOptions();

            while(this.getStatPoints() > 0){
                statOptions.random()[1].call(this);
                this.setStatPoints(this.getStatPoints() - 1);
            }
        }
    }
};

$varlik_ozellik.PlayerStatGainer = {
    name: 'PlayerStatGainer',
    groupName: 'StatGainer',
    listeners:{
        onGainLevel: function(){
            Game.Screen.gainStatScreen.setup(this);
            Game.Screen.playScreen.setSubScreen(Game.Screen.gainStatScreen);
        }
    }
};

Game.sendMessage = function(recipient, message, args){
    if(recipient.hasMixin($varlik_ozellik.MessageRecipient)){
        if(args){
            message = vsprintf(message, args);
        }
        recipient.receiveMessage(message);
    }
};

Game.sendMessageNearby = function(map, centerX, centerY, centerZ, message, args){
    if(args){
        message = vsprintf(message, args);
    }

    entities = map.getEntitiesWithinRadius(centerX, centerY, centerZ, 5);

    for(var i = 0; i < entities.length; i++){
        if(entities[i].hasMixin($varlik_ozellik.MessageRecipient)){
            entities[i].receiveMessage(message);
        }
    }
};


