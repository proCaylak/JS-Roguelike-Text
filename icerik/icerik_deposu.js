Game.Repository = function(name, constor){
    this._name = name;
    this._templates = {};
    this._constor = constor;
    this._randomTemplates = {};
};

$depo = Game.Repository.prototype;

$depo.define = function(name, template, options){
    this._templates[name] = template;

    var disableRandomCreation = options && options['disableRandomCreation'];
    if(!disableRandomCreation){
        this._randomTemplates[name] = template;
    }
};

$depo.create = function(name, extraProperties){    
    if(!this._templates[name]){
        throw new Error("'" + this._name + "' deposunda '" + name + "' adında şablon bulunamadı.");
    }
    var template = Object.create(this._templates[name]);

    if(extraProperties){
        for(var key in extraProperties){
            template[key] = extraProperties[key];
        }
    }
    return new this._constor(template);
};

$depo.createRandom = function(){

    return this.create(Object.keys(this._randomTemplates).random());
};