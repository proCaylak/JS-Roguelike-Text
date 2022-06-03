Game.ItemRepository = new Game.Repository('items', Game.Item);

$esya = Game.ItemRepository;
$esya_ozellik = Game.ItemMixins;

$esya.define('uzum', {
    name: 'üzüm',
    character: '%',
    foreground: 'purple',
    foodValue: 50,
    mixins: [$esya_ozellik.Edible]
});

$esya.define('kavun', {
    name: 'kavun',
    character: 'O',
    foreground: 'lightGreen',
    foodValue: 40,
    consumptions: 4,
    mixins: [$esya_ozellik.Edible]
});

$esya.define('ceset', {
    name: 'ceset',
    character: '&',
    foodValue: 75,
    consumptions: 1,
    mixins: [$esya_ozellik.Edible]
},{
    disableRandomCreation: true
});

$esya.define('tas', {
    name: 'taş',
    character: '*',
    foreground: 'white'
});

$esya.define('hancer', {
    name: 'hançer',
    character: '/',
    foreground: 'brown',
    attackValue: 5,
    wieldable: true,
    mixins: [$esya_ozellik.Equippable]
},{
    disableRandomCreation: true
});

$esya.define('kilic', {
    name: 'kılıç',
    character: '/',
    foreground: 'white',
    attackValue: 10,
    wieldable: true,
    mixins: [$esya_ozellik.Equippable]
},{
    disableRandomCreation: true
});

$esya.define('asa', {
    name: 'asa',
    character: '|',
    foreground: 'yellow',
    attackValue: 5,
    defenseValue: 3,
    wieldable: true,
    mixins: [$esya_ozellik.Equippable]
},{
    disableRandomCreation: true
});

$esya.define('tunik', {
    name: 'tunik',
    character: 'T',
    foreground: 'brown',
    defenseValue: 2,
    wearable: true,
    mixins: [$esya_ozellik.Equippable]
},{
    disableRandomCreation: true
});

$esya.define('zincir zirh', {
    name: 'zincir zırh',
    character: 'T',
    foreground: 'white',
    defenseValue: 4,
    wearable: true,
    mixins: [$esya_ozellik.Equippable]
},{
    disableRandomCreation: true
});

$esya.define('plaka zirh', {
    name: 'plaka zırh',
    character: 'T',
    foreground: 'blue',
    defenseValue: 6,
    wearable: true,
    mixins: [$esya_ozellik.Equippable]
},{
    disableRandomCreation: true
});

$esya.define('balkabagi', {
    name: 'balkabağı',
    character: 'O',
    foreground: 'orange',
    foodValue: 50,
    attackValue: 2,
    defenseValue: 2,
    wearable: true,
    wieldable: true,
    mixins: [$esya_ozellik.Edible, $esya_ozellik.Equippable]
});