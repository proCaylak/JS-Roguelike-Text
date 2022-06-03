Game.Item = function(properties){
    properties = properties || {};
    Game.DynamicGlyph.call(this, properties);
    this._name = properties['name'] || '';
};

Game.Item.extend(Game.DynamicGlyph);