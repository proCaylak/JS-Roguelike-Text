Game.ItemMixins = {};

$esya_ozellik = Game.ItemMixins;

$esya_ozellik.Edible = {
    name: 'Edible',
    init: function(template){
        this._foodValue = template['foodValue'] || 5;
        this._maxConsumptions = template['consumptions'] || 1;
        this._remainingConsumptions = this._maxConsumptions;
    },
    eat: function(entity){
        if(entity.hasMixin('FoodConsumer')){
            if(this.hasRemainingConsumptions()){
                entity.modifyFullnessBy(this._foodValue);
                this._remainingConsumptions--;
            }
        }
    },
    hasRemainingConsumptions: function(){
        return this._remainingConsumptions > 0;
    },
    describe: function(){
        if(this._maxConsumptions != this._remainingConsumptions){
            return 'kısmen tüketilmiş ' + Game.Item.prototype.describe.call(this);
        }else{
            return this._name;
        }
    },
    listeners: {
        'details': function(){
            return [{key: 'gıda', value: this._foodValue}];
        }
    }
};

$esya_ozellik.Equippable = {
    name: 'Equippable',
    init: function(template){
        this._attackValue = template['attackValue'] || 0;
        this._defenseValue = template['defenseValue'] || 0;
        this._wieldable = template['wieldable'] || false;
        this._wearable = template['wearable'] || false;
    },
    getAttackValue: function(){
        return this._attackValue;
    },
    getDefenseValue: function(){
        return this._defenseValue;
    },
    isWieldable: function(){
        return this._wieldable;
    },
    isWearable: function(){
        return this._wearable;
    },
    listeners: {
        'details': function(){
            var results = [];
            if(this._wieldable){
                results.push({key: 'saldırı', value: this.getAttackValue()});                
            }
            if(this._wearable){
                results.push({key: 'savunma', value: this.getDefenseValue()});                
            }
        }
    }    
}