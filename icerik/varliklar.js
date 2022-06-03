$varlik_ozellik = Game.EntityMixins;

Game.PlayerTemplate={
    name: 'madenci (sen)',
    character: '@',
    foreground: 'white',
    maxHp: 40,
    attackValue: 10,
    inventorySlots: 22,
    mixins: [$varlik_ozellik.PlayerActor, $varlik_ozellik.InventoryHolder,
             $varlik_ozellik.Attacker, $varlik_ozellik.Destructible,
             $varlik_ozellik.MessageRecipient, $varlik_ozellik.Sight, 
             $varlik_ozellik.FoodConsumer, $varlik_ozellik.Equipper,
             $varlik_ozellik.ExperienceGainer, $varlik_ozellik.PlayerStatGainer]
};

Game.EntityRepository = new Game.Repository('entities', Game.Entity);

$birim = Game.EntityRepository;

$birim.define('mantar', {
    name: 'mantar',
    character: 'F',
    foreground: 'green',
    maxHp: 10,
    speed: 250,
    mixins: [$varlik_ozellik.FungusActor, $varlik_ozellik.Destructible,
             $varlik_ozellik.ExperienceGainer, $varlik_ozellik.RandomStatGainer]
});

$birim.define('yarasa', {
    name: 'yarasa',
    character: 'M',
    foreground: 'white',
    maxHp: 5,
    attackValue: 4,
    speed: 2000,
    mixins: [$varlik_ozellik.TaskActor, $varlik_ozellik.Attacker,
             $varlik_ozellik.Destructible, $varlik_ozellik.CorpseDropper,
             $varlik_ozellik.ExperienceGainer, $varlik_ozellik.RandomStatGainer]
});

$birim.define('kertenkele', {
    name: 'kertenkele',
    character: ':',
    foreground: 'yellow',
    maxHp: 3,
    attackValue: 2,
    mixins: [$varlik_ozellik.TaskActor, $varlik_ozellik.Attacker,
             $varlik_ozellik.Destructible, $varlik_ozellik.CorpseDropper,
             $varlik_ozellik.ExperienceGainer, $varlik_ozellik.RandomStatGainer]
});

$birim.define('cuce', {
    name: 'cüce',
    character: 'c',
    foreground: 'white',
    maxHp: 6,
    attackValue: 4,
    sightRadius: 5,
    tasks: ['hunt', 'wander'],
    mixins: [$varlik_ozellik.TaskActor, $varlik_ozellik.Attacker,
            $varlik_ozellik.Destructible, $varlik_ozellik.CorpseDropper,
            $varlik_ozellik.Sight, $varlik_ozellik.ExperienceGainer, 
            $varlik_ozellik.RandomStatGainer]
});

$birim.define('gulyabani', {
    name: 'gulyabani',
    character: 'G',
    foreground: 'teal',
    maxHp: 30,
    attackValue: 8,
    defenseValue: 5,
    level: 5,
    sightRadius: 6,
    mixins:[$varlik_ozellik.BossActor, $varlik_ozellik.Attacker,
        $varlik_ozellik.Destructible, $varlik_ozellik.CorpseDropper,
        $varlik_ozellik.Sight, $varlik_ozellik.ExperienceGainer]
},{
    disableRandomCreation: true
});

$birim.define('asker cuce', {
    name: 'asker cüce',
    character: 'c',
    foreground: 'lightGreen',
    maxHp: 10,
    attackValue: 5,
    sightRadius: 3,
    tasks: ['hunt', 'wander'],
    mixins: [$varlik_ozellik.TaskActor, $varlik_ozellik.Attacker,
            $varlik_ozellik.Destructible, $varlik_ozellik.CorpseDropper,
            $varlik_ozellik.Sight, $varlik_ozellik.ExperienceGainer, 
            $varlik_ozellik.RandomStatGainer]
});