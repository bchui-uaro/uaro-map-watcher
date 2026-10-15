import { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Coins,
  Clock,
  Save,
  ChevronDown,
  ChevronUp,
  Swords,
  Pencil,
  X,
  MapPin,
  Flag,
  Search,
  GripVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Skull,
  TriangleAlert,
  StickyNote,
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const SESSION_KEY = "ro-farm-session";
const HISTORY_KEY = "ro-farm-history";
const MAPS_KEY = "ro-farm-maps";
const DEFAULT_ITEMS_KEY = "ro-farm-default-items";
const MONSTERS_KEY = "ro-farm-monsters";
const CUSTOM_ITEMS_KEY = "ro-farm-custom-items";
const STORAGE_HEALTH_KEY = "ro-farm-storage-healthcheck";

// The original artifact host exposed window.storage. In this Streamlit app,
// use browser localStorage behind the same small async interface.
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: async (key) => {
      const value = window.localStorage.getItem(key);
      return value === null ? null : { value };
    },
    set: async (key, value) => {
      window.localStorage.setItem(key, value);
      return { value };
    },
  };
}


// NOTE: This monster/drop database was assembled earlier in this build and
// has no recorded source citation or verification pass. Treat sell prices
// and drop lists as a convenient starting point, not a guaranteed-accurate
// reference — spot-check anything before relying on it for real trades.
const DEFAULT_MONSTERS = [{"id":1219,"name":"Abysmal Knight","items":[{"name":"Reins","sell":401},{"name":"Blade Lost in Darkness","sell":6000},{"name":"Lord's Clothes","sell":10},{"name":"Battle Hook","sell":10},{"name":"Broad Sword","sell":32500},{"name":"Elunium","sell":550},{"name":"Oridecon","sell":550},{"name":"Abysmal Knight Card","sell":10}]},{"id":1713,"name":"Acidus","items":[{"name":"Orange","sell":150},{"name":"Dragon Canine","sell":242},{"name":"Treasure Box","sell":150000},{"name":"Dragon Scale","sell":250},{"name":"Yellow Bijou","sell":443},{"name":"Inverse Scale","sell":10},{"name":"Stone Buckler","sell":15000},{"name":"Gold Acidus Card","sell":10},{"name":"Blue Potion","sell":2500},{"name":"Blue Herb","sell":30},{"name":"Blue Bijou","sell":443},{"name":"Rough Wind","sell":1500},{"name":"Blue Acidus Card","sell":10}]},{"id":1769,"name":"Agav","items":[{"name":"Suspicious Hat","sell":645},{"name":"High Fashion Sandals","sell":12000},{"name":"Bloody Rune","sell":1008},{"name":"Memory Book","sell":10},{"name":"Holy Arrow Quiver","sell":1},{"name":"Agav Card","sell":10}]},{"id":1193,"name":"Alarm","items":[{"name":"Needle of Alarm","sell":273},{"name":"Clip","sell":15000},{"name":"Skull","sell":522},{"name":"Magnifier","sell":20},{"name":"Oridecon","sell":550},{"name":"Key of Clock Tower","sell":50},{"name":"Zargon","sell":240},{"name":"Alarm Card","sell":10},{"name":"Piece of Cogwheel","sell":1}]},{"id":1275,"name":"Alice","items":[{"name":"Alice's Apron","sell":1212},{"name":"Old Broom","sell":175},{"name":"Crystal Pumps","sell":10},{"name":"Rouge","sell":5000},{"name":"Small Ribbons","sell":10},{"name":"Royal Cooking Kit","sell":2500},{"name":"Level 5 Heal","sell":1000},{"name":"Alice Card","sell":10}]},{"id":1735,"name":"Alicel","items":[{"name":"Burnt Part","sell":800},{"name":"Solid Iron Piece","sell":421},{"name":"Steel","sell":500},{"name":"Rusty Screw","sell":267},{"name":"Drill Katar","sell":10},{"name":"Elunium","sell":550},{"name":"Vali's Manteau","sell":15000},{"name":"Alicel Card","sell":10}]},{"id":1736,"name":"Aliot","items":[{"name":"Burnt Part","sell":800},{"name":"Solid Iron Piece","sell":421},{"name":"Falcon Muffler","sell":15000},{"name":"Rusty Screw","sell":267},{"name":"Claw","sell":33500},{"name":"Elunium","sell":550},{"name":"Curved Sword","sell":10},{"name":"Aliot Card","sell":10}]},{"id":1737,"name":"Aliza","items":[{"name":"Brigan","sell":373},{"name":"Morpheus's Shawl","sell":15000},{"name":"Rosary","sell":7500},{"name":"Alice's Apron","sell":1212},{"name":"Royal Cooking Kit","sell":2500},{"name":"Soft Apron","sell":10000},{"name":"Orleans's Server","sell":10},{"name":"Aliza Card","sell":10},{"name":"Solid Iron Piece","sell":421}]},{"id":1271,"name":"Alligator","items":[{"name":"Zargon","sell":240},{"name":"Worn-out Prison Uniform","sell":340},{"name":"Anolian Skin","sell":484},{"name":"Yggdrasil Seed","sell":2500},{"name":"Rough Oridecon","sell":275},{"name":"Alligator Card","sell":10}]},{"id":1301,"name":"Am Mut","items":[{"name":"Dokebi Horn","sell":146},{"name":"Rough Elunium","sell":325},{"name":"Sword Mace","sell":25000},{"name":"Gold","sell":100000},{"name":"Halo","sell":10},{"name":"Old Card Album","sell":5000},{"name":"Glass Bead","sell":700},{"name":"Am Mut Card","sell":10}]},{"id":1094,"name":"Ambernite","items":[{"name":"Crystal Blue","sell":500},{"name":"Snail's Shell","sell":32},{"name":"Garlet","sell":20},{"name":"Shell","sell":7},{"name":"Solid Shell","sell":224},{"name":"Rough Elunium","sell":325},{"name":"Iron Ore","sell":25},{"name":"Ambernite Card","sell":10}]},{"id":1511,"name":"Amon Ra","items":[{"name":"Sphinx Hat","sell":10},{"name":"Safety Ring","sell":37500},{"name":"Fragment of Rossata Stone","sell":1300},{"name":"Elunium","sell":550},{"name":"Old Card Album","sell":5000},{"name":"Tablet","sell":25500},{"name":"Yggdrasil Berry","sell":2500},{"name":"Amon Ra Card","sell":10},{"name":"Yggdrasil Seed","sell":2500},{"name":"3carat Diamond","sell":27500}]},{"id":1030,"name":"Anacondaq","items":[{"name":"Emveretarcon","sell":500},{"name":"Venom Canine","sell":74},{"name":"Glaive","sell":10000},{"name":"Snake Scale","sell":41},{"name":"Scale Shell","sell":233},{"name":"Yellow Herb","sell":20},{"name":"Rough Oridecon","sell":275},{"name":"Anacondaq Card","sell":10}]},{"id":1699,"name":"Ancient Mimic","items":[{"name":"Old Blue Box","sell":5000},{"name":"Old Purple Box","sell":5000},{"name":"Gift Box","sell":500},{"name":"Shoes","sell":1750},{"name":"Manteau","sell":16000},{"name":"Fricco's Shoes","sell":15000},{"name":"Gold Ring","sell":15000},{"name":"Ancient Mimic Card","sell":10}]},{"id":1297,"name":"Ancient Mummy","items":[{"name":"Rotten Bandage","sell":175},{"name":"Memento","sell":300},{"name":"Glove","sell":15000},{"name":"Silver Ring","sell":10000},{"name":"Yellow Herb","sell":20},{"name":"Rough Oridecon","sell":275},{"name":"Rough Elunium","sell":325},{"name":"Ancient Mummy Card","sell":10},{"name":"Orange Potion","sell":100}]},{"id":2019,"name":"Ancient Tree","items":[{"name":"Tough Vines","sell":250},{"name":"Huge Leaf","sell":305},{"name":"Log","sell":125},{"name":"Dead Tree Cane","sell":10},{"name":"Vital Tree Shoes","sell":10}]},{"id":1305,"name":"Ancient Worm","items":[{"name":"Bug Leg","sell":215},{"name":"Zargon","sell":240},{"name":"Boots","sell":9000},{"name":"Bowman Scarf","sell":10},{"name":"Round Shell","sell":390},{"name":"Sticky Mucus","sell":35},{"name":"Brigan","sell":373},{"name":"Ancient Worm Card","sell":10}]},{"id":1095,"name":"Andre","items":[{"name":"Worm Peeling","sell":26},{"name":"Garlet","sell":20},{"name":"Sticky Mucus","sell":35},{"name":"Green Live","sell":500},{"name":"Star Dust","sell":750},{"name":"Iron Ore","sell":25},{"name":"Rough Elunium","sell":325},{"name":"Andre Card","sell":10},{"name":"Shell","sell":7}]},{"id":1096,"name":"Angeling","items":[{"name":"Angel Wing","sell":10},{"name":"Scapulare","sell":3250},{"name":"Yggdrasil Leaf","sell":2000},{"name":"Halo","sell":10},{"name":"White Herb","sell":60},{"name":"Apple","sell":7},{"name":"Emperium","sell":1},{"name":"Angeling Card","sell":10},{"name":"Jellopy","sell":3},{"name":"Poring Doll","sell":900}]},{"id":1206,"name":"Anolian","items":[{"name":"Anolian Skin","sell":484},{"name":"Crystal Arrow","sell":1},{"name":"Royal Jelly","sell":3500},{"name":"Red Scarf","sell":10},{"name":"Solid Shell","sell":224},{"name":"Brooch","sell":15000},{"name":"Oridecon","sell":550},{"name":"Anolian Card","sell":10}]},{"id":1627,"name":"Anopheles","items":[{"name":"Fly Wing","sell":30},{"name":"Bacillus","sell":512},{"name":"Anopheles Card","sell":10}]},{"id":1097,"name":"Ant Egg","items":[{"name":"Phracon","sell":100},{"name":"Shell","sell":7},{"name":"Jellopy","sell":3},{"name":"Sticky Mucus","sell":35},{"name":"Empty Bottle","sell":3},{"name":"Iron Ore","sell":25},{"name":"Andre Egg Card","sell":10}]},{"id":1247,"name":"Antonio","items":[{"name":"Red Stocking","sell":50},{"name":"Gift Box","sell":500},{"name":"Well-baked Cookie","sell":500},{"name":"Piece of Cake","sell":1500},{"name":"Candy","sell":5},{"name":"Candy Cane","sell":10},{"name":"Santa Hat","sell":10},{"name":"Antonio Card","sell":10}]},{"id":1098,"name":"Anubis","items":[{"name":"Rotten Bandage","sell":175},{"name":"Healing Staff","sell":10},{"name":"Memento","sell":300},{"name":"Oridecon","sell":550},{"name":"Cultish Masque","sell":206},{"name":"Celebrant's Mitten","sell":1},{"name":"Wand of Occult","sell":10},{"name":"Anubis Card","sell":10}]},{"id":1365,"name":"Apocalypse","items":[{"name":"Metal Fragment","sell":537},{"name":"Fragment","sell":672},{"name":"Cogwheel","sell":756},{"name":"Elunium","sell":550},{"name":"Destroyer","sell":55000},{"name":"Manteau","sell":16000},{"name":"Steel","sell":500},{"name":"Apocalipse Card","sell":10}]},{"id":2016,"name":"Aqua Elemental","items":[{"name":"Crystalized Teardrop","sell":0},{"name":"Fluorescent Liquid","sell":356},{"name":"Small Bottle","sell":400},{"name":"Aqua Elemental Card","sell":10}]},{"id":1388,"name":"Arc Angeling","items":[{"name":"Evil Wing","sell":10},{"name":"Yggdrasil Leaf","sell":2000},{"name":"Yggdrasil Seed","sell":2500},{"name":"Agate","sell":1500},{"name":"Angel Wing","sell":10},{"name":"Full Plate","sell":40000},{"name":"Turquoise","sell":1500},{"name":"Arc Angeling Card","sell":10}]},{"id":1668,"name":"Archdam","items":[{"name":"Rusty Screw","sell":267},{"name":"Steel","sell":500},{"name":"Oridecon","sell":550},{"name":"Elunium","sell":550},{"name":"Gate Keeper","sell":28000},{"name":"Gate Keeper-DD","sell":36000},{"name":"Archdam Card","sell":10}]},{"id":1016,"name":"Archer Skeleton","items":[{"name":"Skel-Bone","sell":116},{"name":"Rough Oridecon","sell":275},{"name":"Apple of Archer","sell":10},{"name":"Great Bow","sell":5000},{"name":"Fire Arrow","sell":1},{"name":"Red Herb","sell":9},{"name":"Bow","sell":500},{"name":"Archer Skeleton Card","sell":10}]},{"id":1194,"name":"Arclouze","items":[{"name":"Round Shell","sell":390},{"name":"Sticky Mucus","sell":35},{"name":"Solid Shell","sell":224},{"name":"Zargon","sell":240},{"name":"Red Gemstone","sell":300},{"name":"Great Nature","sell":1500},{"name":"Arclouze Card","sell":10}]},{"id":1099,"name":"Argiope","items":[{"name":"Bug Leg","sell":215},{"name":"Zargon","sell":240},{"name":"Rough Elunium","sell":325},{"name":"Boots","sell":9000},{"name":"Green Herb","sell":5},{"name":"Amethyst","sell":3000},{"name":"Argiope Card","sell":10}]},{"id":1100,"name":"Argos","items":[{"name":"Cobweb","sell":92},{"name":"Scell","sell":80},{"name":"Bug Leg","sell":215},{"name":"Rough Elunium","sell":325},{"name":"Green Herb","sell":5},{"name":"Yellow Herb","sell":20},{"name":"Bark Shorts","sell":10},{"name":"Argos Card","sell":10}]},{"id":1654,"name":"Armeyer Dinze","items":[{"name":"Handcuffs","sell":362},{"name":"Muffler","sell":2500},{"name":"Buster","sell":17000},{"name":"Battle Axe","sell":2700},{"name":"Mink Coat","sell":10},{"name":"Axe","sell":250},{"name":"Windhawk","sell":9000},{"name":"Armeyer Dinze Card","sell":10},{"name":"Gift Box","sell":500}]},{"id":1641,"name":"Assassin Cross Eremes","items":[{"name":"Old Purple Box","sell":5000},{"name":"Moonlight Dagger","sell":10},{"name":"Ice Pick","sell":10},{"name":"Glittering Jacket","sell":10},{"name":"Exorciser","sell":10},{"name":"Assassin Dagger","sell":10},{"name":"Bloody Roar","sell":10},{"name":"Ginnungagap","sell":10},{"name":"Assassin Cross Card","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"3carat Diamond","sell":27500},{"name":"Evil Mind","sell":5}]},{"id":1315,"name":"Assaulter","items":[{"name":"Turtle Shell","sell":340},{"name":"Destroyed Armor","sell":521},{"name":"Old Shuriken","sell":890},{"name":"Yellow Herb","sell":20},{"name":"Zargon","sell":240},{"name":"Huuma Wing Shuriken","sell":45000},{"name":"Old Blue Box","sell":5000},{"name":"Assaulter Card","sell":10},{"name":"Trunk","sell":30}]},{"id":1266,"name":"Aster","items":[{"name":"Sticky Mucus","sell":35},{"name":"Coral Reef","sell":386},{"name":"Single Cell","sell":23},{"name":"Yellow Herb","sell":20},{"name":"Zargon","sell":240},{"name":"Apple","sell":7},{"name":"Aster Card","sell":10}]},{"id":1785,"name":"Atroce","items":[{"name":"Bloody Rune","sell":1008},{"name":"Yggdrasil Seed","sell":2500},{"name":"Ring","sell":15000},{"name":"Old Purple Box","sell":5000},{"name":"Yggdrasil Berry","sell":2500},{"name":"Ulle's Cap","sell":15000},{"name":"Atlas Weapon","sell":10},{"name":"Atroce Card","sell":10}]},{"id":1796,"name":"Aunoe","items":[{"name":"White Mask","sell":530},{"name":"High Fashion Sandals","sell":12000},{"name":"Bloody Rune","sell":1008},{"name":"Memory Book","sell":10},{"name":"Holy Arrow Quiver","sell":1},{"name":"Musika","sell":10}]},{"id":1882,"name":"Baba Yaga","items":[{"name":"Worn-out Magic Scroll","sell":386},{"name":"Yaga's Pestle","sell":10},{"name":"Release of Wish","sell":10},{"name":"Pellet","sell":1},{"name":"Piece of Cake","sell":1500},{"name":"Milk","sell":12},{"name":"Bread","sell":75}]},{"id":1107,"name":"Baby Desert Wolf","items":[{"name":"Phracon","sell":100},{"name":"Animal Skin","sell":18},{"name":"Adventurer's Suit","sell":500},{"name":"Meat","sell":25},{"name":"Cotton Shirt","sell":5},{"name":"Asura","sell":1500},{"name":"Orange","sell":150},{"name":"Baby Desert Wolf Card","sell":10}]},{"id":1515,"name":"Baby Hatii","items":[{"name":"Nursing Bottle","sell":550},{"name":"Pinafore","sell":480},{"name":"Ice Cubic","sell":330},{"name":"Frozen Rose","sell":17500},{"name":"Level 5 Frost Diver","sell":1000},{"name":"Hatii Babe Card","sell":10},{"name":"Wooden Block","sell":10}]},{"id":1415,"name":"Baby Leopard","items":[{"name":"Leopard Skin","sell":141},{"name":"Leopard Claw","sell":145},{"name":"Rough Oridecon","sell":275},{"name":"Meat","sell":25},{"name":"Dagger","sell":7000},{"name":"Pet Food","sell":500},{"name":"Baby Leopard Card","sell":10}]},{"id":1811,"name":"Bandit","items":[{"name":"Sunglasses","sell":2500},{"name":"Tiger Panty","sell":149},{"name":"Aloevera","sell":750},{"name":"Ice Cream","sell":75},{"name":"Straw Basket","sell":316}]},{"id":1867,"name":"Banshee","items":[{"name":"Old White Cloth","sell":275},{"name":"Orleans's Gown","sell":10},{"name":"Scalpel","sell":10},{"name":"Wool Scarf","sell":10},{"name":"Memento","sell":300},{"name":"Brigan","sell":373},{"name":"Banshee Card","sell":10}]},{"id":1974,"name":"Banshee Master","items":[{"name":"Brigan","sell":373},{"name":"Old White Cloth","sell":275},{"name":"Orleans's Gown","sell":10},{"name":"Cursed Star","sell":10},{"name":"Wool Scarf","sell":10},{"name":"Memento","sell":300},{"name":"Shadow Guard","sell":10},{"name":"Banshee Master Card","sell":10}]},{"id":1039,"name":"Baphomet","items":[{"name":"Crescent Scythe","sell":10},{"name":"Majestic Goat","sell":10},{"name":"Emperium","sell":1},{"name":"Elunium","sell":550},{"name":"Oridecon","sell":550},{"name":"Baphomet Card","sell":10},{"name":"Yggdrasil Berry","sell":2500},{"name":"Baphomet Doll","sell":9000},{"name":"Evil Horn","sell":600},{"name":"Pole Axe","sell":10},{"name":"War Axe","sell":10},{"name":"Holy Avenger","sell":225000},{"name":"Holy Guard","sell":42500},{"name":"Holy Robe","sell":10},{"name":"Sacred Mission","sell":64000},{"name":"Ring","sell":15000},{"name":"Royal Jelly","sell":3500},{"name":"3carat Diamond","sell":27500}]},{"id":1101,"name":"Baphomet Jr.","items":[{"name":"Evil Horn","sell":600},{"name":"Oridecon","sell":550},{"name":"Halberd","sell":27000},{"name":"Yggdrasil Berry","sell":2500},{"name":"Yggdrasil Leaf","sell":2000},{"name":"Yellow Herb","sell":20},{"name":"Boots","sell":9000},{"name":"Bapho Jr. Card","sell":10}]},{"id":1702,"name":"Baroness of Retribution","items":[{"name":"Red Feather","sell":667},{"name":"Ring","sell":15000},{"name":"Stone of Sage","sell":50000},{"name":"Ruby","sell":3000},{"name":"Manteau","sell":16000},{"name":"Two-Handed Sword","sell":30000},{"name":"Cursed Seal","sell":666},{"name":"Baroness of Retribution Card","sell":10}]},{"id":1102,"name":"Bathory","items":[{"name":"Star Dust","sell":750},{"name":"Witched Starsand","sell":242},{"name":"Wizard Hat","sell":10},{"name":"Arc Wand","sell":22500},{"name":"Star Crumb","sell":2250},{"name":"Old Magicbook","sell":1},{"name":"Old Broom","sell":175},{"name":"Bathory Card","sell":10},{"name":"Wooden Block","sell":10}]},{"id":1874,"name":"Beelzebub","items":[{"name":"Broken Crown","sell":1500},{"name":"Variant Shoes","sell":10},{"name":"Ledger of Death","sell":10},{"name":"Staff of Destruction","sell":10},{"name":"Bison Horn","sell":10},{"name":"Elunium","sell":550},{"name":"Chonchon Doll","sell":1500},{"name":"Berzebub Card","sell":10},{"name":"Old Purple Box","sell":5000},{"name":"Yggdrasil Berry","sell":2500},{"name":"Box of Resentment","sell":500}]},{"id":1494,"name":"Beetle King","items":[{"name":"Solid Husk","sell":70},{"name":"Pincher of Beetle","sell":145},{"name":"Insect Feeler","sell":57},{"name":"Worm Peeling","sell":26},{"name":"Guard","sell":250},{"name":"Beetle King Card","sell":10}]},{"id":1633,"name":"Beholder","items":[{"name":"Prickly Fruit","sell":270},{"name":"Anodyne","sell":1000},{"name":"Rough Wind","sell":1500},{"name":"Elunium","sell":550},{"name":"Old Blue Box","sell":5000},{"name":"Beholder Card","sell":10}]},{"id":1975,"name":"Beholder master","items":[{"name":"Prickly Fruit","sell":270},{"name":"Anodyne","sell":1000},{"name":"Rough Wind","sell":1500},{"name":"Elunium","sell":550},{"name":"Chameleon Armor","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"Linen Glove","sell":10}]},{"id":1060,"name":"Bigfoot","items":[{"name":"Bear's Footskin","sell":87},{"name":"Poo Poo Hat","sell":10},{"name":"Animal Skin","sell":18},{"name":"Puppet","sell":500},{"name":"Potato","sell":7},{"name":"Honey","sell":250},{"name":"Rough Oridecon","sell":275},{"name":"Bigfoot Card","sell":10},{"name":"Wooden Block","sell":10}]},{"id":1084,"name":"Black Mushroom","items":[{"name":"Alcohol","sell":200},{"name":"Detrimindexta","sell":200},{"name":"Dew Laden Moss","sell":5},{"name":"Feather","sell":10},{"name":"Crystal Blue","sell":500},{"name":"Mushroom Spore","sell":18},{"name":"Poison Spore","sell":57}]},{"id":1367,"name":"Blazer","items":[{"name":"Burning Heart","sell":462},{"name":"Live Coal","sell":319},{"name":"White Herb","sell":60},{"name":"Blazer Card","sell":10}]},{"id":1408,"name":"Bloody Butterfly","items":[{"name":"Hard Feeler","sell":285},{"name":"Giant Butterfly Wing","sell":307},{"name":"Butterfly Wing","sell":150},{"name":"Powder of Butterfly","sell":45},{"name":"Waghnak","sell":4000},{"name":"Lariat Whip","sell":10},{"name":"Bloody Butterfly Card","sell":10}]},{"id":1268,"name":"Bloody Knight","items":[{"name":"Brigan","sell":373},{"name":"Helm","sell":22000},{"name":"Full Plate","sell":40000},{"name":"Strong Shield","sell":10},{"name":"Katzbalger","sell":10},{"name":"Pole Axe","sell":10},{"name":"Elunium","sell":550},{"name":"Bloody Knight Card","sell":10},{"name":"Greaves","sell":27000},{"name":"Pauldron","sell":10},{"name":"Legion Plate Armor","sell":51250},{"name":"Heavenly Maiden Robe","sell":10},{"name":"Survivor's Rod","sell":42500},{"name":"Old Purple Box","sell":5000},{"name":"Countermagic Crystal","sell":10}]},{"id":1507,"name":"Bloody Murderer","items":[{"name":"Old Manteau","sell":525},{"name":"Contorted Self-Portrait","sell":1016},{"name":"Rusty Kitchen Knife","sell":890},{"name":"Mr. Scream","sell":10},{"name":"Oridecon","sell":550},{"name":"Kitchen Knife","sell":10},{"name":"Ginnungagap","sell":10},{"name":"Bloody Murderer Card","sell":10}]},{"id":1079,"name":"Blue Plant","items":[{"name":"Blue Herb","sell":30},{"name":"Flower","sell":1},{"name":"Shoot","sell":8},{"name":"Stem","sell":23},{"name":"Pointed Scale","sell":34},{"name":"Mastela Fruit","sell":4250},{"name":"Grape","sell":100},{"name":"Romantic Leaf","sell":10}]},{"id":1025,"name":"Boa","items":[{"name":"Snake Scale","sell":41},{"name":"Katana","sell":1000},{"name":"Red Herb","sell":9},{"name":"Emveretarcon","sell":500},{"name":"Venom Canine","sell":74},{"name":"Shining Scale","sell":233},{"name":"Strawberry","sell":100},{"name":"Snake Card","sell":10}]},{"id":1520,"name":"Boiled Rice","items":[{"name":"Rice Ball","sell":0},{"name":"Rice Ball Doll","sell":250},{"name":"Soft Blade of Grass","sell":200},{"name":"Huge Leaf","sell":305}]},{"id":2068,"name":"Boitata","items":[{"name":"Treasure Box","sell":150000},{"name":"Hurricane's Fury","sell":10},{"name":"Hunting Spear","sell":10},{"name":"Yggdrasil Berry","sell":2500},{"name":"Elunium","sell":550},{"name":"Oridecon","sell":550},{"name":"Hellfire","sell":10},{"name":"Old Purple Box","sell":5000},{"name":"Old Card Album","sell":5000}]},{"id":1188,"name":"Bongun","items":[{"name":"Short Daenggie","sell":139},{"name":"Old Portrait","sell":750},{"name":"Worn Out Scroll","sell":25},{"name":"Bongun Hat","sell":10},{"name":"Amulet","sell":50},{"name":"Yellow Herb","sell":20},{"name":"Bongun Card","sell":10},{"name":"Orange Potion","sell":100},{"name":"Slow Potion","sell":1},{"name":"Speed Potion","sell":1}]},{"id":1830,"name":"Bow Master","items":[{"name":"Destroyed Armor","sell":521},{"name":"Luna Bow","sell":10},{"name":"Bow","sell":500},{"name":"Sniping Suit","sell":10},{"name":"Orleans's Glove","sell":10},{"name":"Bow Guardian Card","sell":10}]},{"id":2024,"name":"Bradium Golem","items":[{"name":"Stone Fragment","sell":320},{"name":"Stone Heart","sell":92},{"name":"Refined Bradium","sell":550},{"name":"Bradium Shield","sell":10}]},{"id":1692,"name":"Breeze","items":[{"name":"Raccoon Leaf","sell":53},{"name":"Four Leaf Clover","sell":40000},{"name":"Romantic Leaf","sell":10},{"name":"Gust Bow","sell":10},{"name":"Dead Branch","sell":25},{"name":"Romantic Flower","sell":10},{"name":"Rough Wind","sell":1500},{"name":"Breeze Card","sell":10}]},{"id":1211,"name":"Brilight","items":[{"name":"Glitter Shell","sell":264},{"name":"Wind of Verdure","sell":500},{"name":"Zargon","sell":240},{"name":"Butterfly Wing","sell":150},{"name":"Rough Elunium","sell":325},{"name":"Yggdrasil Leaf","sell":2000},{"name":"White Herb","sell":60},{"name":"Brilight Card","sell":10}]},{"id":1502,"name":"Bring it on!","items":[{"name":"Poring Hat","sell":10},{"name":"Lucius's Fierce Armor of Volcano","sell":68000},{"name":"Saphien's Armor of Ocean","sell":68000},{"name":"Claytos Cracking Earth Armor","sell":68000},{"name":"Aebecee's Raging Typhoon Armor","sell":68000},{"name":"Bloodied Shackle Ball","sell":25000},{"name":"Large Jellopy","sell":420},{"name":"Holy Guard","sell":42500},{"name":"Grave Keeper's Sword","sell":10},{"name":"Santa Poring Card","sell":10},{"name":"Elven Ears","sell":10}]},{"id":1839,"name":"Byorgue","items":[{"name":"Drill Katar","sell":10},{"name":"Assassin Mask","sell":10},{"name":"Scalpel","sell":10},{"name":"Steamed Alligator with Vegetable","sell":20000},{"name":"Old Blue Box","sell":5000},{"name":"Rider Insignia","sell":10},{"name":"Broken Sword","sell":294},{"name":"Byorgue Card","sell":10}]},{"id":1103,"name":"Caramel","items":[{"name":"Porcupine Quill","sell":79},{"name":"Coat","sell":11000},{"name":"Animal Skin","sell":18},{"name":"Glaive","sell":10000},{"name":"Spear","sell":850},{"name":"Pike","sell":1725},{"name":"Caramel Card","sell":10}]},{"id":1267,"name":"Carat","items":[{"name":"Brigan","sell":373},{"name":"Ice Cream","sell":75},{"name":"High Heels","sell":4250},{"name":"Joker Jester","sell":10},{"name":"White Herb","sell":60},{"name":"Carat Card","sell":10}]},{"id":1307,"name":"Cat o' Nine Tails","items":[{"name":"Puppy Love","sell":10},{"name":"Silver Knife of Chastity","sell":6000},{"name":"Punisher","sell":10},{"name":"Elunium","sell":550},{"name":"Oridecon","sell":550},{"name":"Gold","sell":100000},{"name":"Old Purple Box","sell":5000},{"name":"Cat O' Nine Tails Card","sell":10}]},{"id":1300,"name":"Caterpillar","items":[{"name":"Feather","sell":10},{"name":"Brigan","sell":373},{"name":"Desert Twilight","sell":10},{"name":"Star Crumb","sell":2250},{"name":"Great Nature","sell":1500},{"name":"Blue Potion","sell":2500},{"name":"Yellow Herb","sell":20},{"name":"Caterpillar Card","sell":10}]},{"id":1638,"name":"Cecil Damon","items":[{"name":"Handcuffs","sell":362},{"name":"Immaterial Arrow Quiver","sell":1},{"name":"Tights","sell":35500},{"name":"Crossbow","sell":8500},{"name":"Oridecon Arrow Quiver","sell":1},{"name":"Old Blue Box","sell":5000},{"name":"Falken Blitz","sell":0},{"name":"Cecil Damon Card","sell":10}]},{"id":1987,"name":"Centipede","items":[{"name":"Cold Heart","sell":10},{"name":"Black Cat","sell":10},{"name":"Cursed Lyre","sell":10},{"name":"Bug Leg","sell":215},{"name":"Zargon","sell":240},{"name":"Worm Peeling","sell":26},{"name":"Solid Shell","sell":224},{"name":"Centipede Card","sell":10}]},{"id":1999,"name":"Centipede Larva","items":[{"name":"Boots","sell":9000},{"name":"3carat Diamond","sell":27500},{"name":"Bug Leg","sell":215},{"name":"Zargon","sell":240},{"name":"Worm Peeling","sell":26},{"name":"Solid Shell","sell":224},{"name":"Centipede Larva Card","sell":10}]},{"id":1250,"name":"Chepet","items":[{"name":"Matchstick","sell":50},{"name":"Zargon","sell":240},{"name":"Apple","sell":7},{"name":"Unripe Apple","sell":500},{"name":"Red Scarf","sell":10},{"name":"Yellow Herb","sell":20},{"name":"Ragamuffin Manteau","sell":28000},{"name":"Chepet Card","sell":10}]},{"id":1283,"name":"Chimera","items":[{"name":"Brigan","sell":373},{"name":"Horrendous Hair","sell":400},{"name":"Lemon","sell":30},{"name":"War Axe","sell":10},{"name":"Citrin","sell":1500},{"name":"Great Axe","sell":10},{"name":"Oridecon","sell":550},{"name":"Chimera Card","sell":10}]},{"id":1214,"name":"Choco","items":[{"name":"Claw of Monkey","sell":233},{"name":"Yoyo Tail","sell":57},{"name":"Elunium","sell":550},{"name":"Banana","sell":7},{"name":"Tropical Banana","sell":10},{"name":"Banana Juice","sell":10},{"name":"Yggdrasil Berry","sell":2500},{"name":"Choco Card","sell":10},{"name":"Sweet Bananas","sell":1}]},{"id":1011,"name":"Chonchon","items":[{"name":"Iron","sell":50},{"name":"Shell","sell":7},{"name":"Jellopy","sell":3},{"name":"Cutter","sell":625},{"name":"Fly Wing","sell":30},{"name":"Chonchon Doll","sell":1500},{"name":"Iron Ore","sell":25},{"name":"Chonchon Card","sell":10}]},{"id":1246,"name":"Christmas Cookie","items":[{"name":"Well-baked Cookie","sell":500},{"name":"Pearl","sell":3000},{"name":"Zargon","sell":240},{"name":"Hood","sell":500},{"name":"Gift Box","sell":500},{"name":"Level 3 Cold Bolt","sell":500},{"name":"Red Herb","sell":9},{"name":"Christmas Cookie Card","sell":10}]},{"id":1245,"name":"Christmas Goblin","items":[{"name":"Wrapping Lace","sell":0},{"name":"Wrapping Paper","sell":0},{"name":"Rough Oridecon","sell":275},{"name":"Gift Box","sell":500},{"name":"Dirk","sell":4250},{"name":"Buckler","sell":7000},{"name":"Santa Hat","sell":10},{"name":"Goblin Card","sell":10},{"name":"Wooden Block","sell":10}]},{"id":1244,"name":"Christmas Jakk","items":[{"name":"Jack o' Pumpkin","sell":187},{"name":"Zargon","sell":240},{"name":"Elunium","sell":550},{"name":"Tights","sell":35500},{"name":"Gift Box","sell":500},{"name":"Wrapping Paper","sell":0},{"name":"Wrapping Lace","sell":0},{"name":"Jakk Card","sell":10}]},{"id":1588,"name":"Christmas Orc","items":[{"name":"Iron","sell":50},{"name":"Orcish Voucher","sell":71},{"name":"Rough Oridecon","sell":275},{"name":"Wrapping Paper","sell":0},{"name":"Battle Axe","sell":2700},{"name":"Gift Box","sell":500},{"name":"Wrapping Lace","sell":0},{"name":"Orc Warrior Card","sell":10}]},{"id":1269,"name":"Clock","items":[{"name":"Needle of Alarm","sell":273},{"name":"Trunk","sell":30},{"name":"White Herb","sell":60},{"name":"Lemon","sell":30},{"name":"Key of Clock Tower","sell":50},{"name":"Key of Underground","sell":50},{"name":"Elunium","sell":550},{"name":"Clock Card","sell":10}]},{"id":1270,"name":"Clock Tower Manager","items":[{"name":"Needle of Alarm","sell":273},{"name":"Brigan","sell":373},{"name":"Steel","sell":500},{"name":"Hinalle Leaflet","sell":75},{"name":"Memory Book","sell":10},{"name":"Key of Clock Tower","sell":50},{"name":"Key of Underground","sell":50},{"name":"Tower Keeper Card","sell":10}]},{"id":1976,"name":"Cobalt Mineral","items":[{"name":"Crystal Fragment","sell":276},{"name":"Topaz","sell":3000},{"name":"Elemental Sword","sell":10},{"name":"Oridecon","sell":550},{"name":"Emveretarcon","sell":500},{"name":"Yellow Gemstone","sell":300},{"name":"Gold","sell":100000},{"name":"Emperium","sell":1}]},{"id":1104,"name":"Coco","items":[{"name":"Acorn","sell":49},{"name":"Hood","sell":500},{"name":"Fluff","sell":4},{"name":"Animal Skin","sell":18},{"name":"Potato","sell":7},{"name":"Sandals","sell":200},{"name":"Strawberry","sell":100},{"name":"Coco Card","sell":10},{"name":"Sweet Beans","sell":1}]},{"id":1009,"name":"Condor","items":[{"name":"Talon","sell":10},{"name":"Bow","sell":500},{"name":"Yellow Gemstone","sell":300},{"name":"Arrow","sell":0},{"name":"Meat","sell":25},{"name":"Feather of Birds","sell":5},{"name":"Orange","sell":150},{"name":"Condor Card","sell":10},{"name":"Engrave Treasure Box","sell":0}]},{"id":1738,"name":"Constant","items":[{"name":"Burnt Part","sell":800},{"name":"Solid Iron Piece","sell":421},{"name":"Flexible Tube","sell":51},{"name":"Steel","sell":500},{"name":"Rough Elunium","sell":325}]},{"id":1265,"name":"Cookie","items":[{"name":"Well-baked Cookie","sell":500},{"name":"Candy Cane","sell":10},{"name":"Darkgreen Dyestuffs","sell":4000},{"name":"Chef King Orleans Vol.1","sell":4000},{"name":"Sandals","sell":200},{"name":"Level 3 Heal","sell":1000},{"name":"Candy","sell":5},{"name":"Cookie Card","sell":10}]},{"id":1992,"name":"Cornus","items":[{"name":"Sprint Mail","sell":10},{"name":"Angelic Ring","sell":10},{"name":"Mystic Horn","sell":500},{"name":"Soft Feather","sell":140},{"name":"Horseshoe","sell":294},{"name":"Unicorn Horn","sell":10},{"name":"Long Horn","sell":10},{"name":"Cornus Card","sell":10}]},{"id":1067,"name":"Cornutus","items":[{"name":"Crystal Blue","sell":500},{"name":"Conch","sell":79},{"name":"Scell","sell":80},{"name":"Rough Elunium","sell":325},{"name":"Shield","sell":28000},{"name":"Solid Shell","sell":224},{"name":"Blue Gemstone","sell":300},{"name":"Cornutus Card","sell":10}]},{"id":1073,"name":"Crab","items":[{"name":"Crab Shell","sell":45},{"name":"Nipper","sell":57},{"name":"Stone","sell":0},{"name":"Star Dust","sell":750},{"name":"Rough Elunium","sell":325},{"name":"Crab Card","sell":10}]},{"id":1209,"name":"Cramp","items":[{"name":"Claw of Rat","sell":374},{"name":"Monster's Feed","sell":30},{"name":"Sapphire","sell":3000},{"name":"Glass Bead","sell":700},{"name":"Lemon","sell":30},{"name":"Blue Herb","sell":30},{"name":"Oridecon","sell":550},{"name":"Cramp Card","sell":10}]},{"id":1018,"name":"Creamy","items":[{"name":"Powder of Butterfly","sell":45},{"name":"Silk Robe","sell":4000},{"name":"Honey","sell":250},{"name":"Butterfly Wing","sell":150},{"name":"Fancy Flower","sell":10},{"name":"Flower","sell":1},{"name":"Level 3 Lightening Bolt","sell":500},{"name":"Creamy Card","sell":10}]},{"id":1293,"name":"Creamy Fear","items":[{"name":"Powder of Butterfly","sell":45},{"name":"Silver Robe","sell":3500},{"name":"Honey","sell":250},{"name":"Butterfly Wing","sell":150},{"name":"Book","sell":15000},{"name":"Icarus Wings","sell":10},{"name":"Mastela Fruit","sell":4250},{"name":"Creamy Fear Card","sell":10}]},{"id":1248,"name":"Cruiser","items":[{"name":"Manacles","sell":329},{"name":"Monk Hat","sell":15000},{"name":"Iron","sell":50},{"name":"Rough Wind","sell":1500},{"name":"Scell","sell":80},{"name":"Branch","sell":1500},{"name":"Rough Oridecon","sell":275},{"name":"Cruiser Card","sell":10}]},{"id":1877,"name":"Crystal","items":[{"name":"Special Gold","sell":10},{"name":"Gift Box","sell":500},{"name":"Piece of Cake","sell":1500},{"name":"Candy Cane","sell":10},{"name":"White Chocolate","sell":2500},{"name":"Banana Juice","sell":10},{"name":"Chocolate","sell":0},{"name":"Yggdrasil Berry","sell":2500},{"name":"Apple Juice","sell":10},{"name":"Yggdrasil Seed","sell":2500},{"name":"Carrot Juice","sell":10},{"name":"Dead Branch","sell":25},{"name":"Grape Juice","sell":125},{"name":"Old Blue Box","sell":5000}]},{"id":2074,"name":"Curupira","items":[{"name":"Meat","sell":25},{"name":"Rough Elunium","sell":325},{"name":"Emveretarcon","sell":500},{"name":"Tiger Panty","sell":149},{"name":"Mace","sell":800}]},{"id":1700,"name":"Dame of Sentinel","items":[{"name":"Blue Feather","sell":704},{"name":"Ring","sell":15000},{"name":"Cursed Seal","sell":666},{"name":"Topaz","sell":3000},{"name":"Stone of Sage","sell":50000},{"name":"Hair Band","sell":250},{"name":"Golden Ornament","sell":953},{"name":"Dame of Sentinel Card","sell":10}]},{"id":2031,"name":"Dandelion","items":[{"name":"Pope Cookie","sell":5}]},{"id":1260,"name":"Dark Frame","items":[{"name":"Brigan","sell":373},{"name":"Red Frame","sell":1500},{"name":"Manteau","sell":16000},{"name":"Star Crumb","sell":2250},{"name":"Crystal Mirror","sell":7500},{"name":"Dark Frame Card","sell":10}]},{"id":1302,"name":"Dark Illusion","items":[{"name":"Evil Bone Wand","sell":10},{"name":"Bone Helm","sell":10},{"name":"Ragamuffin Manteau","sell":28000},{"name":"Brigan","sell":373},{"name":"Mastela Fruit","sell":4250},{"name":"White Herb","sell":60},{"name":"Broad Sword","sell":32500},{"name":"Dark Illusion Card","sell":10}]},{"id":1272,"name":"Dark Lord","items":[{"name":"Evil Bone Wand","sell":10},{"name":"Kronos","sell":10},{"name":"Grimtooth","sell":10},{"name":"Mage Coat","sell":10},{"name":"Ancient Cape","sell":41000},{"name":"Elunium","sell":550},{"name":"Bone Helm","sell":10},{"name":"Dark Lord Card","sell":10},{"name":"Skull","sell":522},{"name":"Coif","sell":75000},{"name":"Old Purple Box","sell":5000}]},{"id":2015,"name":"Dark Pinguicula","items":[{"name":"Sharp Leaf","sell":403},{"name":"Huge Leaf","sell":305},{"name":"Brown Root","sell":280},{"name":"Karvodailnirol","sell":200},{"name":"Withered Flower","sell":445}]},{"id":1198,"name":"Dark Priest","items":[{"name":"Book of the Apocalypse","sell":30000},{"name":"Rosary","sell":7500},{"name":"Blue Potion","sell":2500},{"name":"Red Gemstone","sell":300},{"name":"Hand of God","sell":1},{"name":"Glittering Jacket","sell":10},{"name":"Cursed Dagger","sell":40000},{"name":"Dark Priest Card","sell":10}]},{"id":2023,"name":"Dark Shadow","items":[{"name":"Piece of Black Cloth","sell":263},{"name":"Skull Ring","sell":5000},{"name":"Dagger of Hunter","sell":10},{"name":"Dark Piece","sell":500},{"name":"Eye Stone Ring","sell":10},{"name":"Bradium Stone Hammer","sell":10},{"name":"Dark Shadow Card","sell":10}]},{"id":1875,"name":"Dead King","items":[{"name":"Broken Crown","sell":1500},{"name":"Sticky Mucus","sell":35}]},{"id":1698,"name":"Death Word","items":[{"name":"Worn Out Page","sell":474},{"name":"Bookclip in Memory","sell":1500},{"name":"Kafra Legend Vol.1","sell":4000},{"name":"Bloody Page","sell":340},{"name":"Vidar's Boots","sell":15000},{"name":"Level 8 Cookbook","sell":500},{"name":"Level 9 Cookbook","sell":500},{"name":"Death Word Card","sell":10}]},{"id":1384,"name":"Deleter","items":[{"name":"Dragon Skin","sell":512},{"name":"Dragon Canine","sell":242},{"name":"Dragon Tail","sell":600},{"name":"Dragon Scale","sell":250},{"name":"Sky Deleter Card","sell":10},{"name":"Earth Deleter Card","sell":10}]},{"id":1812,"name":"Delightful Lude","items":[{"name":"Pumpkin Lantern","sell":243},{"name":"Jack o' Pumpkin","sell":187},{"name":"Pumpkin","sell":7},{"name":"Pumpkin Mojo","sell":0}]},{"id":1378,"name":"Demon Pungus","items":[{"name":"Bacillus","sell":512},{"name":"Mould Powder","sell":233},{"name":"Yellow Gemstone","sell":300},{"name":"Witched Starsand","sell":242},{"name":"Demon Pungus Card","sell":10}]},{"id":1105,"name":"Deniro","items":[{"name":"Worm Peeling","sell":26},{"name":"Garlet","sell":20},{"name":"Sticky Mucus","sell":35},{"name":"Red Blood","sell":500},{"name":"Star Dust","sell":750},{"name":"Iron Ore","sell":25},{"name":"Rough Elunium","sell":325},{"name":"Andre Card","sell":10}]},{"id":1106,"name":"Desert Wolf","items":[{"name":"Katar","sell":20500},{"name":"Claw of Desert Wolf","sell":104},{"name":"Mink Coat","sell":10},{"name":"Meat","sell":25},{"name":"Wolf Claw","sell":29},{"name":"Rough Oridecon","sell":275},{"name":"Stiletto","sell":9750},{"name":"Desert Wolf Card","sell":10},{"name":"Wooden Block","sell":10}]},{"id":1705,"name":"Despero of Thanatos","items":[{"name":"Brigan","sell":373},{"name":"2carat Diamond","sell":12500},{"name":"3carat Diamond","sell":27500},{"name":"Fragment of Despair","sell":753},{"name":"Old Card Album","sell":5000},{"name":"Goibne's Greaves","sell":15000},{"name":"Despero of Thanatos Card","sell":10}]},{"id":1817,"name":"Detarderous","items":[{"name":"Soul","sell":1},{"name":"Dragon Wing","sell":10},{"name":"Wizardry Staff","sell":10},{"name":"Bloody Roar","sell":10},{"name":"Dragon Breath Cocktail","sell":50000},{"name":"Cooked Nine Tail's Tails","sell":50000}]},{"id":1719,"name":"Detardeurus","items":[{"name":"Morpheus's Bracelet","sell":15000},{"name":"Morpheus's Ring","sell":15000},{"name":"Treasure Box","sell":150000},{"name":"Fire Dragon Scale","sell":926},{"name":"Dragon Breath Cocktail","sell":50000},{"name":"Pole Axe","sell":10},{"name":"Jewel Crown","sell":10},{"name":"Detardeurus Card","sell":10},{"name":"Old Purple Box","sell":5000},{"name":"Old Blue Box","sell":5000},{"name":"3carat Diamond","sell":27500}]},{"id":1108,"name":"Deviace","items":[{"name":"Mystic Frozen","sell":1500},{"name":"Ancient Tooth","sell":274},{"name":"Ancient Lips","sell":500},{"name":"Aerial","sell":10},{"name":"Detrimindexta","sell":200},{"name":"Katar of Frozen Icicle","sell":22500},{"name":"Rough Oridecon","sell":275},{"name":"Deviace Card","sell":10}]},{"id":1582,"name":"Deviling","items":[{"name":"Little Evil Wing","sell":1000},{"name":"Zargon","sell":240},{"name":"Evil Wing","sell":10},{"name":"Apple","sell":7},{"name":"Blade Lost in Darkness","sell":6000},{"name":"Black Dyestuffs","sell":4000},{"name":"Level 3 Soul Strike","sell":500},{"name":"Deviling Card","sell":10},{"name":"Jellopy","sell":3},{"name":"Poring Doll","sell":900}]},{"id":1109,"name":"Deviruchi","items":[{"name":"Little Evil Horn","sell":264},{"name":"Little Evil Wing","sell":1000},{"name":"Oridecon","sell":550},{"name":"Partizan","sell":13500},{"name":"Hand of God","sell":1},{"name":"Zargon","sell":240},{"name":"Rough Oridecon","sell":275},{"name":"Deviruchi Card","sell":10},{"name":"Wooden Block","sell":10}]},{"id":1382,"name":"Diabolic","items":[{"name":"Little Evil Horn","sell":264},{"name":"Little Evil Wing","sell":1000},{"name":"Brooch","sell":15000},{"name":"Oridecon","sell":550},{"name":"Unholy Touch","sell":10},{"name":"Diabolic Card","sell":10}]},{"id":1669,"name":"Dimik","items":[{"name":"Dimik Card","sell":10},{"name":"Used Iron Plate","sell":512},{"name":"Transparent Plate","sell":10},{"name":"Steel","sell":500},{"name":"Fragment","sell":672},{"name":"Dusk","sell":11750},{"name":"Oridecon","sell":550},{"name":"Royal Cooking Kit","sell":2500},{"name":"Thunder P","sell":38000},{"name":"Armor Charm","sell":10000}]},{"id":1506,"name":"Disguise","items":[{"name":"Red Muffler","sell":330},{"name":"Tangled Chains","sell":370},{"name":"Hood","sell":500},{"name":"Honey","sell":250},{"name":"Ragamuffin Manteau","sell":28000},{"name":"Muffler","sell":2500},{"name":"Rider Insignia","sell":10},{"name":"Disguise Card","sell":10}]},{"id":1110,"name":"Dokebi","items":[{"name":"Dokebi Horn","sell":146},{"name":"Rough Elunium","sell":325},{"name":"Sword Mace","sell":25000},{"name":"Mighty Staff","sell":10},{"name":"Gold","sell":100000},{"name":"Club","sell":60},{"name":"Hammer of Blacksmith","sell":1},{"name":"Dokebi Card","sell":10}]},{"id":1707,"name":"Dolor of Thanatos","items":[{"name":"Brigan","sell":373},{"name":"2carat Diamond","sell":12500},{"name":"3carat Diamond","sell":27500},{"name":"Fragment of Agony","sell":753},{"name":"Old Card Album","sell":5000},{"name":"Goibne's Helm","sell":15000},{"name":"Dolor of Thanatos Card","sell":10}]},{"id":1046,"name":"Doppelganger","items":[{"name":"Full Plate","sell":40000},{"name":"Broad Sword","sell":32500},{"name":"Zweihander","sell":10},{"name":"Spiky Band","sell":10},{"name":"Lance","sell":30000},{"name":"Elunium","sell":550},{"name":"Oridecon","sell":550},{"name":"Doppelganger Card","sell":10},{"name":"Cursed Ruby","sell":300},{"name":"Blue Potion","sell":2500},{"name":"Symbol of a Brave Warrior","sell":0}]},{"id":2013,"name":"Draco","items":[{"name":"Dragon's Mane","sell":0},{"name":"Dragon Skin","sell":512},{"name":"Dragon Canine","sell":242},{"name":"Dragon Tail","sell":600},{"name":"Dragon Scale","sell":250},{"name":"Honey","sell":250},{"name":"Draco Card","sell":10}]},{"id":2014,"name":"Draco Egg","items":[{"name":"Piece of Egg Shell","sell":84},{"name":"Egg Shell","sell":10}]},{"id":1389,"name":"Dracula","items":[{"name":"Yggdrasil Berry","sell":2500},{"name":"Wizardry Staff","sell":10},{"name":"Ballista","sell":62000},{"name":"Ancient Cape","sell":41000},{"name":"Ring","sell":15000},{"name":"Book of the Apocalypse","sell":30000},{"name":"Dracula Card","sell":10},{"name":"3carat Diamond","sell":27500},{"name":"Mastela Fruit","sell":4250}]},{"id":1721,"name":"Dragon Egg","items":[{"name":"Elunium","sell":550},{"name":"Piece of Egg Shell","sell":84},{"name":"2carat Diamond","sell":12500},{"name":"3carat Diamond","sell":27500},{"name":"Garnet","sell":3000},{"name":"Aquamarine","sell":3000},{"name":"Topaz","sell":3000},{"name":"Dragon Egg Card","sell":10}]},{"id":1091,"name":"Dragon Fly","items":[{"name":"Sweet Gent","sell":7500},{"name":"Red Herb","sell":9},{"name":"Amethyst","sell":3000},{"name":"Chonchon Doll","sell":1500},{"name":"Clip","sell":15000},{"name":"Rusty Iron","sell":50},{"name":"Grape Juice","sell":125},{"name":"Dragon Fly Card","sell":10}]},{"id":1321,"name":"Dragon Tail","items":[{"name":"Wing of Dragonfly","sell":260},{"name":"Round Shell","sell":390},{"name":"Solid Shell","sell":224},{"name":"Fancy Flower","sell":10},{"name":"Cap","sell":6000},{"name":"Fly Wing","sell":30},{"name":"Butterfly Wing","sell":150},{"name":"Dragon Tail Card","sell":10}]},{"id":1111,"name":"Drainliar","items":[{"name":"Emveretarcon","sell":500},{"name":"Tooth of Bat","sell":17},{"name":"Sardonyx","sell":3000},{"name":"Red Herb","sell":9},{"name":"Wing of Red Bat","sell":84},{"name":"Rough Oridecon","sell":275},{"name":"Drainliar Card","sell":10}]},{"id":1112,"name":"Drake","items":[{"name":"Saber","sell":24500},{"name":"Ring Pommel Saber","sell":12000},{"name":"Cutlus","sell":10},{"name":"Haedonggum","sell":25000},{"name":"Corsair","sell":10},{"name":"Elunium","sell":550},{"name":"Krasnaya","sell":10},{"name":"Drake Card","sell":10},{"name":"White Potion","sell":600},{"name":"Amethyst","sell":3000}]},{"id":1846,"name":"Dream Metal","items":[{"name":"Dragonball Yellow","sell":10}]},{"id":1380,"name":"Driller","items":[{"name":"Frill","sell":125},{"name":"Yellow Gemstone","sell":300},{"name":"Red Gemstone","sell":300},{"name":"Driller Card","sell":10}]},{"id":1113,"name":"Drops","items":[{"name":"Jellopy","sell":3},{"name":"Rod","sell":25},{"name":"Sticky Mucus","sell":35},{"name":"Apple","sell":7},{"name":"Empty Bottle","sell":3},{"name":"Orange Juice","sell":750},{"name":"Drops Card","sell":10}]},{"id":1781,"name":"Drosera","items":[{"name":"Sticky Poison","sell":175},{"name":"Sticky Mucus","sell":35},{"name":"Maneater Blossom","sell":98},{"name":"Maneater Root","sell":104},{"name":"Bitter Herb","sell":10},{"name":"Stem","sell":23},{"name":"Drosera Card","sell":10}]},{"id":1493,"name":"Dryad","items":[{"name":"Tough Vines","sell":250},{"name":"Huge Leaf","sell":305},{"name":"Brown Root","sell":280},{"name":"Rope","sell":1250},{"name":"Chemeti Whip","sell":10},{"name":"Romantic Leaf","sell":10},{"name":"Sharp Leaf","sell":403},{"name":"Dryad Card","sell":10}]},{"id":1504,"name":"Dullahan","items":[{"name":"Helm of Dullahan","sell":675},{"name":"Armor Piece of Dullahan","sell":395},{"name":"Eye of Dullahan","sell":45000},{"name":"Manteau","sell":16000},{"name":"Dullahan Card","sell":10}]},{"id":1409,"name":"Dumpling Child","items":[{"name":"Piece of Bamboo","sell":155},{"name":"Oil Paper","sell":105},{"name":"Clown Nose","sell":10},{"name":"Vane","sell":80},{"name":"Bao","sell":0},{"name":"Festival Mask","sell":50},{"name":"Dumpling Child Card","sell":10}]},{"id":2018,"name":"Duneyrr","items":[{"name":"Carrot","sell":7},{"name":"Fur","sell":352},{"name":"Dark Piece","sell":500},{"name":"Eye Stone Ring","sell":10},{"name":"Veteran Sword","sell":5000},{"name":"Veteran Axe","sell":5000}]},{"id":1114,"name":"Dustiness","items":[{"name":"Moth Dust","sell":69},{"name":"Moth Wings","sell":100},{"name":"Masquerade","sell":10},{"name":"Insect Feeler","sell":57},{"name":"Star Dust","sell":750},{"name":"Red Herb","sell":9},{"name":"Dustiness Card","sell":10}]},{"id":1396,"name":"Earth Crystal","items":[{"name":"Piece of Cake","sell":1500},{"name":"Candy Cane","sell":10},{"name":"White Chocolate","sell":2500},{"name":"Gift Box","sell":500},{"name":"Holiday Hat","sell":0},{"name":"Apple Juice","sell":10},{"name":"Chocolate","sell":0},{"name":"Yggdrasil Seed","sell":2500}]},{"id":1770,"name":"Echio","items":[{"name":"Suspicious Hat","sell":645},{"name":"Yggdrasil Seed","sell":2500},{"name":"Bloody Rune","sell":1008},{"name":"Beret","sell":15000},{"name":"Holy Arrow Quiver","sell":1},{"name":"Divine Cloth","sell":10},{"name":"Echio Card","sell":10}]},{"id":1093,"name":"Eclipse","items":[{"name":"Cute Ribbon","sell":250},{"name":"Red Herb","sell":9},{"name":"Opal","sell":3000},{"name":"Glass Bead","sell":700},{"name":"Four Leaf Clover","sell":40000},{"name":"Rainbow Carrot","sell":1250},{"name":"Angelic Protection","sell":5000},{"name":"Eclipse Card","sell":10}]},{"id":1115,"name":"Eddga","items":[{"name":"Fireblend","sell":10},{"name":"Pipe","sell":10},{"name":"Honey","sell":250},{"name":"Katar of Raging Blaze","sell":22500},{"name":"Tiger's Footskin","sell":750},{"name":"Elunium","sell":550},{"name":"Krierg","sell":10},{"name":"Eddga Card","sell":10},{"name":"Tiger Skin","sell":274},{"name":"Flame Heart","sell":1500}]},{"id":1116,"name":"Eggyra","items":[{"name":"Scell","sell":80},{"name":"Egg Shell","sell":10},{"name":"Piece of Egg Shell","sell":84},{"name":"Red Herb","sell":9},{"name":"Pet Incubator","sell":1500},{"name":"Concentration Potion","sell":400},{"name":"Rough Elunium","sell":325},{"name":"Eggyra Card","sell":10}]},{"id":1652,"name":"Egnigem Cenia","items":[{"name":"Research Chart","sell":420},{"name":"Katzbalger","sell":10},{"name":"Two-Handed Sword","sell":30000},{"name":"Saber","sell":24500},{"name":"Padded Armor","sell":24000},{"name":"Slayer","sell":7500},{"name":"Full Plate","sell":40000},{"name":"Egnigem Cenia Card","sell":10},{"name":"Broad Sword","sell":32500},{"name":"Gift Box","sell":500},{"name":"Old Blue Box","sell":5000},{"name":"Schweizersabel","sell":10},{"name":"Formal Suit","sell":10},{"name":"Boots","sell":9000},{"name":"Nagan","sell":10},{"name":"General Egnigem Cenia Card","sell":10},{"name":"Old Purple Box","sell":5000},{"name":"3carat Diamond","sell":27500}]},{"id":1377,"name":"Elder","items":[{"name":"Worn-out Magic Scroll","sell":386},{"name":"Torn Magic Book","sell":571},{"name":"Torn Scroll","sell":680},{"name":"Encyclopedia","sell":10},{"name":"Wizardry Staff","sell":10},{"name":"Old Card Album","sell":5000},{"name":"Key of Underground","sell":50},{"name":"Elder Card","sell":10}]},{"id":1033,"name":"Elder Willow","items":[{"name":"Red Blood","sell":500},{"name":"Resin","sell":60},{"name":"Trunk","sell":30},{"name":"Rough Elunium","sell":325},{"name":"Wooden Mail","sell":2750},{"name":"Level 3 Fire Bolt","sell":500},{"name":"Dead Branch","sell":25},{"name":"Elder Willow Card","sell":10}]},{"id":1410,"name":"Enchanted Peach Tree","items":[{"name":"Solid Peach","sell":200},{"name":"Royal Jelly","sell":3500},{"name":"Dead Branch","sell":25},{"name":"Banana Juice","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"Enchanted Peach Tree Card","sell":10}]},{"id":1957,"name":"Entweihen Crothen","items":[{"name":"Thorn Staff of Darkness","sell":10},{"name":"Holy Stick","sell":10},{"name":"Heavenly Maiden Robe","sell":10},{"name":"Lich's Bone Wand","sell":10},{"name":"Old Card Album","sell":5000},{"name":"Survivor's Rod","sell":42500},{"name":"Agate","sell":1500},{"name":"Entweihen Crothen Card","sell":10}]},{"id":1635,"name":"Eremes Guile","items":[{"name":"Research Chart","sell":420},{"name":"Krishna","sell":10},{"name":"Pauldron","sell":10},{"name":"Loki's Nail","sell":10},{"name":"Specialty Jur","sell":10},{"name":"Poison Bottle","sell":2500},{"name":"Thief Clothes","sell":37000},{"name":"Eremes Guile Card","sell":10}]},{"id":1655,"name":"Errende Ebecee","items":[{"name":"Handcuffs","sell":362},{"name":"Biretta","sell":4500},{"name":"Morning Star","sell":20500},{"name":"Sword Mace","sell":25000},{"name":"Saint's Robe","sell":27000},{"name":"Scapulare","sell":3250},{"name":"Spike","sell":10},{"name":"Errende Ebecee Card","sell":10},{"name":"Gift Box","sell":500}]},{"id":1117,"name":"Evil Druid","items":[{"name":"Biretta","sell":4500},{"name":"Evil Bone Wand","sell":10},{"name":"Ragamuffin Manteau","sell":28000},{"name":"Bible","sell":30000},{"name":"Yggdrasil Leaf","sell":2000},{"name":"Level 7 Cookbook","sell":500},{"name":"White Herb","sell":60},{"name":"Evil Druid Card","sell":10}]},{"id":1416,"name":"Evil Nymph","items":[{"name":"Transparent Celestial Robe","sell":325},{"name":"Soft Silk","sell":600},{"name":"Oridecon","sell":550},{"name":"Mandolin","sell":9000},{"name":"Lute","sell":12250},{"name":"Level 5 Heal","sell":1000},{"name":"Oriental Lute","sell":10},{"name":"Evil Nymph Card","sell":10}]},{"id":1418,"name":"Evil Snake Lord","items":[{"name":"Ba Gua","sell":1400},{"name":"Grave Keeper's Sword","sell":10},{"name":"Hellfire","sell":10},{"name":"Ph.D Hat","sell":10},{"name":"Gae Bolg","sell":10},{"name":"Pellet","sell":1},{"name":"Soft Apron","sell":10000},{"name":"Evil Snake Lord Card","sell":10},{"name":"Yggdrasil Berry","sell":2500},{"name":"Old Purple Box","sell":5000},{"name":"Elunium","sell":550}]},{"id":1205,"name":"Executioner","items":[{"name":"Bloody Edge","sell":5000},{"name":"Phlogopite","sell":1500},{"name":"Rapier","sell":5000},{"name":"Scimitar","sell":8500},{"name":"Ring Pommel Saber","sell":12000},{"name":"Steel","sell":500},{"name":"Oridecon","sell":550},{"name":"Executioner Card","sell":10}]},{"id":1383,"name":"Explosion","items":[{"name":"Wing of Red Bat","sell":84},{"name":"Burning Heart","sell":462},{"name":"Burning Hair","sell":487},{"name":"Rough Oridecon","sell":275},{"name":"Mastela Fruit","sell":4250},{"name":"Explosion Card","sell":10}]},{"id":1007,"name":"Fabre","items":[{"name":"Fluff","sell":4},{"name":"Feather","sell":10},{"name":"Club","sell":60},{"name":"Emerald","sell":3000},{"name":"Green Herb","sell":5},{"name":"Clover","sell":5},{"name":"Fabre Card","sell":10}]},{"id":1871,"name":"Fallen Bishop Hibram","items":[{"name":"Holy Water","sell":10},{"name":"Long Horn","sell":10},{"name":"Spiritual Ring","sell":10},{"name":"Hunting Spear","sell":10},{"name":"Elunium","sell":550},{"name":"Wand of Occult","sell":10},{"name":"Fallen Bishop Hibram Card","sell":10},{"name":"Yggdrasil Berry","sell":2500},{"name":"Yggdrasil Seed","sell":2500},{"name":"3carat Diamond","sell":27500}]},{"id":1371,"name":"False Angel","items":[{"name":"Blue Gemstone","sell":300},{"name":"Yellow Gemstone","sell":300},{"name":"Red Gemstone","sell":300},{"name":"Cursed Water","sell":1},{"name":"Carrot Whip","sell":10},{"name":"False Angel Card","sell":10}]},{"id":1005,"name":"Familiar","items":[{"name":"Tooth of Bat","sell":17},{"name":"Falchion","sell":750},{"name":"Ribbon","sell":400},{"name":"Fly Wing","sell":30},{"name":"Grape","sell":100},{"name":"Red Herb","sell":9},{"name":"Concentration Potion","sell":400},{"name":"Familiar Card","sell":10}]},{"id":1797,"name":"Fanat","items":[{"name":"Kandura","sell":10},{"name":"High Fashion Sandals","sell":12000},{"name":"Bloody Rune","sell":1008},{"name":"Memory Book","sell":10},{"name":"Holy Arrow Quiver","sell":1},{"name":"White Mask","sell":530}]},{"id":1714,"name":"Ferus","items":[{"name":"Strawberry","sell":100},{"name":"Dragon Canine","sell":242},{"name":"Dragon Skin","sell":512},{"name":"Dragon Scale","sell":250},{"name":"Red Bijou","sell":443},{"name":"Flame Heart","sell":1500},{"name":"Magni's Cap","sell":15000},{"name":"Red Ferus Card","sell":10},{"name":"Fresh Fish","sell":125},{"name":"Green Bijou","sell":443},{"name":"Great Nature","sell":1500},{"name":"Green Ferus Card","sell":10}]},{"id":1397,"name":"Fire Crystal","items":[{"name":"Piece of Cake","sell":1500},{"name":"Candy Cane","sell":10},{"name":"White Chocolate","sell":2500},{"name":"Gift Box","sell":500},{"name":"Holiday Hat","sell":0},{"name":"Carrot Juice","sell":10},{"name":"Chocolate","sell":0},{"name":"Dead Branch","sell":25}]},{"id":1837,"name":"Fire Imp","items":[{"name":"Burning Hair","sell":487},{"name":"Huuma Blaze Shuriken","sell":39000},{"name":"Live Coal","sell":319},{"name":"Heart Breaker","sell":10},{"name":"Electric Eel","sell":10},{"name":"Ice Fireworks","sell":10},{"name":"Imp Card","sell":10}]},{"id":1403,"name":"Firelock Soldier","items":[{"name":"Iron","sell":50},{"name":"Apple of Archer","sell":10},{"name":"Large Jellopy","sell":420},{"name":"Yellow Herb","sell":20},{"name":"Yam","sell":90},{"name":"Panacea","sell":250},{"name":"Cyclone","sell":8750},{"name":"Firelock Soldier Card","sell":10}]},{"id":1869,"name":"Flame Skull","items":[{"name":"Skull","sell":522},{"name":"Black Leather Boots","sell":10},{"name":"Lever Action Rifle","sell":10},{"name":"Horrendous Mouth","sell":195},{"name":"Flame Skull Card","sell":10}]},{"id":1118,"name":"Flora","items":[{"name":"Maneater Blossom","sell":98},{"name":"Sunflower","sell":10},{"name":"Aloe","sell":250},{"name":"Aloe Leaflet","sell":180},{"name":"Singing Flower","sell":150},{"name":"Stem","sell":23},{"name":"Witherless Rose","sell":27500},{"name":"Flora Card","sell":10}]},{"id":1319,"name":"Freezer","items":[{"name":"Turtle Shell","sell":340},{"name":"Broken Shell","sell":450},{"name":"Ice Cubic","sell":330},{"name":"Zargon","sell":240},{"name":"Royal Jelly","sell":3500},{"name":"Cyfar","sell":386},{"name":"Level 5 Cold Bolt","sell":1000},{"name":"Freezer Card","sell":10},{"name":"Wooden Block","sell":10}]},{"id":1119,"name":"Frilldora","items":[{"name":"Frill","sell":125},{"name":"Rough Elunium","sell":325},{"name":"Reptile Tongue","sell":70},{"name":"Emerald","sell":3000},{"name":"Yellow Gemstone","sell":300},{"name":"Red Herb","sell":9},{"name":"Zargon","sell":240},{"name":"Frilldora Card","sell":10}]},{"id":1753,"name":"Frus","items":[{"name":"Rune of Darkness","sell":1263},{"name":"Brigan","sell":373},{"name":"Red Gemstone","sell":300},{"name":"Earring","sell":15000},{"name":"Mantle","sell":5000},{"name":"Rough Elunium","sell":325},{"name":"Frus Card","sell":10}]},{"id":1309,"name":"Gajomart","items":[{"name":"Stone Heart","sell":92},{"name":"Zargon","sell":240},{"name":"Yellow Herb","sell":20},{"name":"Bomb Wick","sell":10},{"name":"Fire Arrow","sell":1},{"name":"Magic Bible Vol1","sell":10},{"name":"Flame Heart","sell":1500},{"name":"Gajomart Card","sell":10}]},{"id":1391,"name":"Galapago","items":[{"name":"Cyfar","sell":386},{"name":"Yggdrasil Leaf","sell":2000},{"name":"Yellow Herb","sell":20},{"name":"Aloevera","sell":750},{"name":"Anodyne","sell":1000},{"name":"Galapago Cap","sell":10},{"name":"Orange","sell":150},{"name":"Galapago Card","sell":10}]},{"id":1783,"name":"Galion","items":[{"name":"Rotten Meat","sell":51},{"name":"Animal Skin","sell":18},{"name":"Rough Wind","sell":1500},{"name":"Ulfhedinn","sell":10},{"name":"Galion Card","sell":10}]},{"id":1592,"name":"Gangster","items":[{"name":"Stone","sell":0},{"name":"Fly Wing","sell":30},{"name":"Cutter","sell":625},{"name":"Empty Bottle","sell":3},{"name":"Rice Cake","sell":5}]},{"id":1932,"name":"Garden Keeper","items":[{"name":"Crystal Key","sell":0}]},{"id":1253,"name":"Gargoyle","items":[{"name":"Zargon","sell":240},{"name":"Little Evil Wing","sell":1000},{"name":"Bow Thimble","sell":5000},{"name":"Mute Arrow","sell":5},{"name":"Rough Elunium","sell":325},{"name":"Gargoyle Card","sell":10}]},{"id":1778,"name":"Gazeti","items":[{"name":"Glacial Heart","sell":303},{"name":"Ice Cubic","sell":330},{"name":"Elunium","sell":550},{"name":"Frozen Bow","sell":10},{"name":"Gazeti Card","sell":10}]},{"id":1681,"name":"Gemini-S58","items":[{"name":"Skull","sell":522},{"name":"Old Blue Box","sell":5000},{"name":"Butcher","sell":65000},{"name":"Condensed Yellow Potion","sell":300},{"name":"Condensed White Potion","sell":825},{"name":"Level 8 Cookbook","sell":500},{"name":"Stone of Sage","sell":50000},{"name":"Gemini-S58 Card","sell":10}]},{"id":1368,"name":"Geographer","items":[{"name":"Maneater Blossom","sell":98},{"name":"Maneater Root","sell":104},{"name":"Sunflower","sell":10},{"name":"Fancy Flower","sell":10},{"name":"Level 5 Heal","sell":1000},{"name":"Geographer Card","sell":10}]},{"id":1120,"name":"Ghostring","items":[{"name":"Fabric","sell":153},{"name":"Ghost Bandana","sell":10},{"name":"Thief Clothes","sell":37000},{"name":"Dead Branch","sell":25},{"name":"Old Blue Box","sell":5000},{"name":"Emperium","sell":1},{"name":"Level 5 Soul Strike","sell":1000},{"name":"Ghostring Card","sell":10}]},{"id":1036,"name":"Ghoul","items":[{"name":"Horrendous Mouth","sell":195},{"name":"Rough Oridecon","sell":275},{"name":"White Herb","sell":60},{"name":"Green Herb","sell":5},{"name":"Skull Ring","sell":5000},{"name":"Memento","sell":300},{"name":"Sharpened Legbone of Ghoul","sell":26250},{"name":"Ghoul Card","sell":10}]},{"id":1303,"name":"Giant Hornet","items":[{"name":"Royal Jelly","sell":3500},{"name":"Honey","sell":250},{"name":"Mastela Fruit","sell":4250},{"name":"Yggdrasil Leaf","sell":2000},{"name":"Staff","sell":4750},{"name":"Pearl","sell":3000},{"name":"Double Bound","sell":10},{"name":"Giant Hornet Card","sell":10}]},{"id":1304,"name":"Giant Spider","items":[{"name":"Cobweb","sell":92},{"name":"Bug Leg","sell":215},{"name":"Rough Elunium","sell":325},{"name":"Panacea","sell":250},{"name":"Solid Shell","sell":224},{"name":"Round Shell","sell":390},{"name":"Cyfar","sell":386},{"name":"Giant Spider Card","sell":10}]},{"id":1186,"name":"Giant Whisper","items":[{"name":"Star Dust","sell":750},{"name":"Fabric","sell":153},{"name":"Halo","sell":10},{"name":"Silver Robe","sell":3500},{"name":"Giant Whisper Card","sell":10}]},{"id":1503,"name":"Gibbet","items":[{"name":"Hung Doll","sell":510},{"name":"Decomposed Rope","sell":195},{"name":"Wooden Gnarl","sell":234},{"name":"Cursed Ruby","sell":300},{"name":"Red Gemstone","sell":300},{"name":"Dead Branch","sell":25},{"name":"Gibbet Card","sell":10}]},{"id":1121,"name":"Giearth","items":[{"name":"Great Nature","sell":1500},{"name":"Coal","sell":250},{"name":"Elder Pixie's Moustache","sell":116},{"name":"Elven Ears","sell":10},{"name":"Cap","sell":6000},{"name":"Star Dust","sell":750},{"name":"Giearth Card","sell":10}]},{"id":1387,"name":"Gig","items":[{"name":"Scorpion Claw","sell":353},{"name":"Scorpion Tail","sell":62},{"name":"Red Gemstone","sell":300},{"name":"Panacea","sell":250},{"name":"Flame Heart","sell":1500},{"name":"Gig Card","sell":10}]},{"id":1768,"name":"Gloom Under Night","items":[{"name":"Will of Red Darkness","sell":765},{"name":"Blade Lost in Darkness","sell":6000},{"name":"Old Hilt","sell":75},{"name":"Old Card Album","sell":5000},{"name":"Heavenly Maiden Robe","sell":10},{"name":"Hurricane's Fury","sell":10},{"name":"Gloom Under Night Card","sell":10},{"name":"Yggdrasil Berry","sell":2500},{"name":"Old Purple Box","sell":5000}]},{"id":1372,"name":"Goat","items":[{"name":"Antelope Horn","sell":336},{"name":"Antelope Skin","sell":378},{"name":"Empty Bottle","sell":3},{"name":"Red Herb","sell":9},{"name":"Blue Herb","sell":30},{"name":"Yellow Herb","sell":20},{"name":"Green Herb","sell":5},{"name":"Goat Card","sell":10}]},{"id":1122,"name":"Goblin","items":[{"name":"Iron","sell":50},{"name":"Scell","sell":80},{"name":"Rough Oridecon","sell":275},{"name":"Goblin Mask","sell":10},{"name":"Dirk","sell":4250},{"name":"Buckler","sell":7000},{"name":"Red Herb","sell":9},{"name":"Goblin Card","sell":10},{"name":"Indian Fillet","sell":10},{"name":"Flail","sell":8000},{"name":"Red Bandana","sell":10},{"name":"Surprised Mask","sell":10},{"name":"Yellow Herb","sell":20},{"name":"Green Live","sell":500},{"name":"Poker Face","sell":10},{"name":"Zorro Masque","sell":10},{"name":"Smasher","sell":4500},{"name":"Wand","sell":1250},{"name":"Annoyed Mask","sell":10}]},{"id":1258,"name":"Goblin Archer","items":[{"name":"Goblin Mask","sell":10},{"name":"Iron","sell":50},{"name":"Scell","sell":80},{"name":"Oridecon Arrow","sell":15},{"name":"Red Herb","sell":9},{"name":"Composite Bow","sell":1250},{"name":"Grape","sell":100},{"name":"Goblin Archer Card","sell":10}]},{"id":1299,"name":"Goblin Leader","items":[{"name":"Brigan","sell":373},{"name":"Steel","sell":500},{"name":"Rough Oridecon","sell":275},{"name":"Goblin Leader Mask","sell":10},{"name":"Shield","sell":28000},{"name":"Yellow Herb","sell":20},{"name":"Angry Snarl","sell":10},{"name":"Goblin Leader Card","sell":10}]},{"id":1280,"name":"Goblin Steamrider","items":[{"name":"Scell","sell":80},{"name":"Cyfar","sell":386},{"name":"Iron","sell":50},{"name":"Steel","sell":500},{"name":"Coal","sell":250},{"name":"Garrison","sell":24000},{"name":"Rough Elunium","sell":325},{"name":"Goblin Steamrider Card","sell":10}]},{"id":1840,"name":"Golden Savage","items":[{"name":"Yggdrasil Leaf","sell":2000},{"name":"Treasure Box","sell":150000},{"name":"Old Card Album","sell":5000},{"name":"Gold","sell":100000},{"name":"Emperium","sell":1},{"name":"Golden Gear","sell":10},{"name":"New Year Rice Cake","sell":10}]},{"id":1086,"name":"Golden Thief Bug","items":[{"name":"Gold","sell":100000},{"name":"Golden Mace","sell":10},{"name":"Golden Gear","sell":10},{"name":"Golden Bell","sell":10},{"name":"Emperium","sell":1},{"name":"Elunium","sell":550},{"name":"Oridecon","sell":550},{"name":"Golden Thief Bug Card","sell":10},{"name":"Gold Ring","sell":15000},{"name":"Ora Ora","sell":27500}]},{"id":1040,"name":"Golem","items":[{"name":"Steel","sell":500},{"name":"Stone Heart","sell":92},{"name":"Zargon","sell":240},{"name":"Rough Elunium","sell":325},{"name":"Coal","sell":250},{"name":"Yellow Gemstone","sell":300},{"name":"Iron","sell":50},{"name":"Golem Card","sell":10}]},{"id":1885,"name":"Gopinich","items":[{"name":"Old Purple Box","sell":5000},{"name":"Ring","sell":15000},{"name":"Dragon Breath Cocktail","sell":50000},{"name":"Ixion Wings","sell":10},{"name":"Pole Axe","sell":10},{"name":"Treasure Box","sell":150000},{"name":"Grand Circlet","sell":10},{"name":"Yggdrasil Berry","sell":2500}]},{"id":1816,"name":"Gourd","items":[{"name":"Apple","sell":7}]},{"id":1369,"name":"Grand Peco","items":[{"name":"Peco Peco Feather","sell":227},{"name":"Mastela Fruit","sell":4250},{"name":"Wind of Verdure","sell":500},{"name":"Gold","sell":100000},{"name":"Orange","sell":150},{"name":"Grand Peco Card","sell":10}]},{"id":1929,"name":"Great Demon Baphomet","items":[{"name":"Cursed Baphomet Doll","sell":0},{"name":"Pauldron","sell":10},{"name":"Tae Goo Lyeon","sell":10},{"name":"Bloodied Shackle Ball","sell":25000},{"name":"Heavenly Maiden Robe","sell":10},{"name":"Holy Robe","sell":10},{"name":"Crescent Scythe","sell":10},{"name":"Baphomet Card","sell":10}]},{"id":1277,"name":"Greatest General","items":[{"name":"Brigan","sell":373},{"name":"Trunk","sell":30},{"name":"Club","sell":60},{"name":"Authoritative Badge","sell":725},{"name":"Stop Post","sell":10},{"name":"Yellow Herb","sell":20},{"name":"Level 3 Earth Spike","sell":500},{"name":"Greatest General Card","sell":10}]},{"id":1519,"name":"Green Maiden","items":[{"name":"Cyfar","sell":386},{"name":"Puppet","sell":500},{"name":"Studded Knuckles","sell":16000},{"name":"Honey","sell":250},{"name":"Tantan Noodle","sell":10},{"name":"Cake Hat","sell":10},{"name":"Bao Bao","sell":10},{"name":"Green Maiden Card","sell":10}]},{"id":1080,"name":"Green Plant","items":[{"name":"Green Herb","sell":5},{"name":"Flower","sell":1},{"name":"Bitter Herb","sell":10},{"name":"Stem","sell":23},{"name":"Pointed Scale","sell":34},{"name":"Aloe","sell":250},{"name":"Aloe Leaflet","sell":180},{"name":"Romantic Leaf","sell":10}]},{"id":1632,"name":"Gremlin","items":[{"name":"Will of the Darkness","sell":367},{"name":"Sticky Mucus","sell":35},{"name":"Amethyst","sell":3000},{"name":"Boots","sell":9000},{"name":"Bloody Roar","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"Gremlin Card","sell":10}]},{"id":1381,"name":"Grizzly","items":[{"name":"Bear's Footskin","sell":87},{"name":"Animal Skin","sell":18},{"name":"Yam","sell":90},{"name":"Grizzly Card","sell":10}]},{"id":1687,"name":"Grove","items":[{"name":"Aloe Leaflet","sell":180},{"name":"Reptile Tongue","sell":70},{"name":"Hinalle Leaflet","sell":75},{"name":"Green Herb","sell":5},{"name":"Monster's Feed","sell":30},{"name":"Aloevera","sell":750},{"name":"Grove Card","sell":10}]},{"id":1259,"name":"Gryphon","items":[{"name":"Talon of Griffon","sell":2709},{"name":"Brigan","sell":373},{"name":"Soft Feather","sell":140},{"name":"Guisarme","sell":6500},{"name":"Pole Axe","sell":10},{"name":"Oridecon","sell":550},{"name":"Rough Wind","sell":1500},{"name":"Gryphon Card","sell":10}]},{"id":1828,"name":"Gullinbrusti","items":[{"name":"Straw Rice Bag","sell":0},{"name":"Lucky Candy","sell":5},{"name":"Lucky Candy Cane","sell":10}]},{"id":1311,"name":"Gullinbursti","items":[{"name":"Mane","sell":98},{"name":"Grape","sell":100},{"name":"Animal Gore","sell":225},{"name":"Angled Glasses","sell":10},{"name":"Anodyne","sell":1000},{"name":"Belt","sell":10000},{"name":"Zargon","sell":240},{"name":"Gullinbursti Card","sell":10}]},{"id":1990,"name":"Hardrock Mammoth","items":[{"name":"Bone Head","sell":10},{"name":"Tournament Shield","sell":10},{"name":"Ivory Lance","sell":10},{"name":"Ivory Knife","sell":10},{"name":"Hard Skin","sell":442},{"name":"Unicorn Horn","sell":10},{"name":"Elunium","sell":550}]},{"id":1376,"name":"Harpy","items":[{"name":"Harpy Feather","sell":571},{"name":"Harpy Talon","sell":605},{"name":"Yellow Herb","sell":20},{"name":"Izidor","sell":250},{"name":"Electric Fist","sell":10},{"name":"Harpy Card","sell":10}]},{"id":1252,"name":"Hatii","items":[{"name":"Fang of Hatii","sell":50},{"name":"Ice Falchion","sell":10},{"name":"Katar of Frozen Icicle","sell":22500},{"name":"Hatii Claw","sell":10},{"name":"Elunium","sell":550},{"name":"Oridecon","sell":550},{"name":"Hatii Card","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"Mystic Frozen","sell":1500}]},{"id":2071,"name":"Headless Mule","items":[{"name":"Burning Horseshoe","sell":411},{"name":"Full Plate","sell":40000},{"name":"Burning Heart","sell":462},{"name":"Burning Hair","sell":487},{"name":"Inverse Scale","sell":10},{"name":"Jamadhar","sell":18600}]},{"id":1318,"name":"Heater","items":[{"name":"Turtle Shell","sell":340},{"name":"Broken Shell","sell":450},{"name":"Level 5 Fire Ball","sell":1000},{"name":"Zargon","sell":240},{"name":"Royal Jelly","sell":3500},{"name":"Brigan","sell":373},{"name":"Burnt Tree","sell":361},{"name":"Heater Card","sell":10}]},{"id":1977,"name":"Heavy Metaling","items":[{"name":"Flexible Tube","sell":51},{"name":"Iron Ore","sell":25},{"name":"Iron","sell":50},{"name":"Large Jellopy","sell":420},{"name":"Rusty Screw","sell":267},{"name":"Dagger of Hunter","sell":10},{"name":"Jubilee","sell":16}]},{"id":1510,"name":"Heirozoist","items":[{"name":"Broken Needle","sell":345},{"name":"Spool","sell":212},{"name":"Needle Packet","sell":416},{"name":"Puppet","sell":500},{"name":"Ectoplasm","sell":161},{"name":"Rough Elunium","sell":325},{"name":"Angry Snarl","sell":10},{"name":"Hylozoist Card","sell":10}]},{"id":1978,"name":"Hell Apocalypse","items":[{"name":"Metal Fragment","sell":537},{"name":"Steel","sell":500},{"name":"Fragment","sell":672},{"name":"Cogwheel","sell":756},{"name":"Manteau","sell":16000},{"name":"Elunium","sell":550},{"name":"Life Link","sell":10},{"name":"Cardo","sell":10}]},{"id":1866,"name":"Hell Poodle","items":[{"name":"Monster's Feed","sell":30},{"name":"Tooth Blade","sell":10},{"name":"Wild Beast Claw","sell":10},{"name":"Skel-Bone","sell":116},{"name":"Well-Dried Bone","sell":5000},{"name":"Animal Skin","sell":18},{"name":"Pet Food","sell":500},{"name":"Hell Poodle Card","sell":10}]},{"id":1626,"name":"Hellion Revenant","items":[{"name":"Eye of Hellion","sell":0}]},{"id":1413,"name":"Hermit Plant","items":[{"name":"Hinalle Leaflet","sell":75},{"name":"Aloe Leaflet","sell":180},{"name":"Maneater Root","sell":104},{"name":"Maneater Blossom","sell":98},{"name":"Potato","sell":7},{"name":"Rope","sell":1250},{"name":"Strawberry","sell":100},{"name":"Hermit Plant Card","sell":10}]},{"id":2030,"name":"Hiden Priest","items":[{"name":"Pope Cookie","sell":5}]},{"id":1213,"name":"High Orc","items":[{"name":"Ogre Tooth","sell":329},{"name":"Orcish Axe","sell":10},{"name":"Steel","sell":500},{"name":"Orcish Voucher","sell":71},{"name":"Zargon","sell":240},{"name":"Rough Oridecon","sell":275},{"name":"Yellow Herb","sell":20},{"name":"High Orc Card","sell":10}]},{"id":1643,"name":"High Priest Margaretha","items":[{"name":"Old Purple Box","sell":5000},{"name":"Berserk","sell":10},{"name":"Safety Ring","sell":37500},{"name":"Heavenly Maiden Robe","sell":10},{"name":"Book of the Apocalypse","sell":30000},{"name":"Quadrille","sell":10},{"name":"Grand Cross","sell":10},{"name":"Sage's Diary","sell":10},{"name":"High Priest Card","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"3carat Diamond","sell":27500},{"name":"Evil Mind","sell":5}]},{"id":1645,"name":"High Wizard Kathryne","items":[{"name":"Old Purple Box","sell":5000},{"name":"Cursed Dagger","sell":40000},{"name":"Dagger of Counter","sell":60000},{"name":"Critical Ring","sell":37500},{"name":"Robe of Cast","sell":62400},{"name":"Heavenly Maiden Robe","sell":10},{"name":"Survivor's Rod","sell":42500},{"name":"Glittering Jacket","sell":10},{"name":"High Wizard Card","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"3carat Diamond","sell":27500},{"name":"Evil Mind","sell":5}]},{"id":1629,"name":"Hill Wind","items":[{"name":"Meat","sell":25},{"name":"Monster's Feed","sell":30},{"name":"Hill Wind Card","sell":10},{"name":"Harpy Feather","sell":571},{"name":"Harpy Talon","sell":605},{"name":"Blue Herb","sell":30}]},{"id":1989,"name":"Hillslion","items":[{"name":"Sprint Shoes","sell":10},{"name":"Horn of Hillslion","sell":10},{"name":"Fur","sell":352},{"name":"Wild Beast Claw","sell":10},{"name":"Soft Feather","sell":140},{"name":"Brigan","sell":373},{"name":"Hillsrion Card","sell":10}]},{"id":1127,"name":"Hode","items":[{"name":"Green Live","sell":500},{"name":"Earthworm Peeling","sell":98},{"name":"Rough Elunium","sell":325},{"name":"Sticky Mucus","sell":35},{"name":"Town Sword","sell":21000},{"name":"Foolishness of the Blind","sell":10},{"name":"Fatty Chubby Earthworm","sell":2500},{"name":"Hode Card","sell":10}]},{"id":1773,"name":"Hodremlin","items":[{"name":"Red Prickly Fruit","sell":440},{"name":"Will of the Darkness","sell":367},{"name":"Boots","sell":9000},{"name":"Sticky Mucus","sell":35},{"name":"Bloody Rune","sell":1008},{"name":"Witched Starsand","sell":242},{"name":"Shadow Walk","sell":10},{"name":"Hodremlin Card","sell":10}]},{"id":1628,"name":"Holden","items":[{"name":"Mole Whiskers","sell":53},{"name":"Mole Claw","sell":105},{"name":"Super Novice Hat","sell":4250},{"name":"Six Shooter","sell":2250},{"name":"Holden Card","sell":10}]},{"id":1128,"name":"Horn","items":[{"name":"Green Live","sell":500},{"name":"Emveretarcon","sell":500},{"name":"Horn","sell":58},{"name":"Guisarme","sell":6500},{"name":"Shell","sell":7},{"name":"Solid Shell","sell":224},{"name":"Horn Card","sell":10}]},{"id":1004,"name":"Hornet","items":[{"name":"Wind of Verdure","sell":500},{"name":"Bee Sting","sell":16},{"name":"Jellopy","sell":3},{"name":"Main Gauche","sell":1200},{"name":"Green Herb","sell":5},{"name":"Honey","sell":250},{"name":"Hornet Card","sell":10}]},{"id":1129,"name":"Horong","items":[{"name":"Stone Heart","sell":92},{"name":"Zargon","sell":240},{"name":"Bomb Wick","sell":10},{"name":"Fire Arrow","sell":1},{"name":"Rough Elunium","sell":325},{"name":"Sweet Potato","sell":10},{"name":"Alcohol","sell":200},{"name":"Horong Card","sell":10}]},{"id":1636,"name":"Howard Alt-Eisen","items":[{"name":"Handcuffs","sell":362},{"name":"Pauldron","sell":10},{"name":"Vecer Axe","sell":10},{"name":"Two-Handed Axe","sell":27500},{"name":"Buckler","sell":7000},{"name":"Lord's Clothes","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"Howard Alt-Eisen Card","sell":10}]},{"id":1035,"name":"Hunter Fly","items":[{"name":"Rough Wind","sell":1500},{"name":"Steel","sell":500},{"name":"Solid Shell","sell":224},{"name":"Zargon","sell":240},{"name":"Rough Oridecon","sell":275},{"name":"Mini Propeller","sell":10},{"name":"Damascus","sell":24500},{"name":"Hunter Fly Card","sell":10}]},{"id":1068,"name":"Hydra","items":[{"name":"Emveretarcon","sell":500},{"name":"Tentacle","sell":35},{"name":"Sticky Mucus","sell":35},{"name":"Detrimindexta","sell":200},{"name":"Panacea","sell":250},{"name":"Meat","sell":25},{"name":"Hydra Card","sell":10}]},{"id":1720,"name":"Hydrolancer","items":[{"name":"Dragon Skin","sell":512},{"name":"Dragon Canine","sell":242},{"name":"Three-Headed Dragon's Head","sell":478},{"name":"Morpheus's Hood","sell":15000},{"name":"Morrigane's Helm","sell":15000},{"name":"Immortal Stew","sell":50000},{"name":"Fricca's Circlet","sell":15000},{"name":"Hydrolancer Card","sell":10},{"name":"Neck of Demon Dragon","sell":5},{"name":"Dragon Killer","sell":10},{"name":"Jewel Crown","sell":10},{"name":"Pole Axe","sell":10},{"name":"Dragon Breath Cocktail","sell":50000},{"name":"Treasure Box","sell":150000}]},{"id":2069,"name":"Iara","items":[{"name":"Mystic Frozen","sell":1500},{"name":"Heart of Mermaid","sell":132},{"name":"Fin","sell":206},{"name":"Witherless Rose","sell":27500},{"name":"Crystal Mirror","sell":7500},{"name":"Illusion Flower","sell":500},{"name":"Mage Coat","sell":10}]},{"id":1777,"name":"Ice Titan","items":[{"name":"Glacial Heart","sell":303},{"name":"Ice Cubic","sell":330},{"name":"Frozen Rose","sell":17500},{"name":"Oridecon","sell":550},{"name":"Elunium","sell":550},{"name":"Mystic Frozen","sell":1500},{"name":"Ice Titan Card","sell":10}]},{"id":1789,"name":"Iceicle","items":[{"name":"Ice Cubic","sell":330}]},{"id":1832,"name":"Ifrit","items":[{"name":"Flame Heart","sell":1500},{"name":"Spiritual Ring","sell":10},{"name":"Ring Of Flame Lord","sell":10},{"name":"Ring Of Resonance","sell":10},{"name":"Hellfire","sell":10},{"name":"Fireblend","sell":10},{"name":"Lucius's Fierce Armor of Volcano","sell":68000},{"name":"Ifrit Card","sell":10},{"name":"Old Purple Box","sell":5000},{"name":"Old Blue Box","sell":5000},{"name":"Old Card Album","sell":5000}]},{"id":1918,"name":"Incarnation of Morocc","items":[{"name":"Sacred Mission","sell":64000},{"name":"Crystal of Darkness","sell":5},{"name":"Fragment of Darkness","sell":250},{"name":"Elunium","sell":550},{"name":"Brigan","sell":373},{"name":"Diabolus Manteau","sell":10},{"name":"Nemesis","sell":10},{"name":"Skin of Ventus","sell":10},{"name":"Oridecon","sell":550},{"name":"Cyfar","sell":386},{"name":"Cross Shield","sell":10},{"name":"Ragamuffin Manteau","sell":28000},{"name":"Cursed Hand","sell":10},{"name":"Bloody Eater","sell":10},{"name":"Diabolus Ring","sell":10},{"name":"Exorcism Bible","sell":10}]},{"id":1374,"name":"Incubus","items":[{"name":"Mastela Fruit","sell":4250},{"name":"White Herb","sell":60},{"name":"Incubus Horn","sell":10},{"name":"Ring","sell":15000},{"name":"Gold Ring","sell":15000},{"name":"Diamond Ring","sell":22500},{"name":"Incubus Card","sell":10}]},{"id":1257,"name":"Injustice","items":[{"name":"Steel","sell":500},{"name":"Brigan","sell":373},{"name":"Cyfar","sell":386},{"name":"Padded Armor","sell":24000},{"name":"Full Plate","sell":40000},{"name":"Forbidden Red Candle","sell":10000},{"name":"Jamadhar","sell":18600},{"name":"Injustice Card","sell":10}]},{"id":1212,"name":"Iron Fist","items":[{"name":"Tail of Steel Scorpion","sell":274},{"name":"Rough Elunium","sell":325},{"name":"Iron Ore","sell":25},{"name":"Steel","sell":500},{"name":"Iron","sell":50},{"name":"Iron Fist Card","sell":10}]},{"id":1772,"name":"Isilla","items":[{"name":"White Mask","sell":530},{"name":"High Fashion Sandals","sell":12000},{"name":"Bloody Rune","sell":1008},{"name":"Gold Ring","sell":15000},{"name":"Ring","sell":15000},{"name":"Isilla Card","sell":10}]},{"id":1029,"name":"Isis","items":[{"name":"Scale Shell","sell":233},{"name":"Circlet","sell":3750},{"name":"Necklace","sell":15000},{"name":"Cracked Diamond","sell":5},{"name":"3carat Diamond","sell":27500},{"name":"Shining Scale","sell":233},{"name":"2carat Diamond","sell":12500},{"name":"Isis Card","sell":10}]},{"id":2072,"name":"Jaguar","items":[{"name":"Leopard Skin","sell":141},{"name":"Leopard Claw","sell":145},{"name":"Animal Skin","sell":18},{"name":"Rough Oridecon","sell":275},{"name":"Claw","sell":33500}]},{"id":1130,"name":"Jakk","items":[{"name":"Jack o' Pumpkin","sell":187},{"name":"Zargon","sell":240},{"name":"Elunium","sell":550},{"name":"Tights","sell":35500},{"name":"Necklace of Oblivion","sell":1},{"name":"Pumpkin","sell":7},{"name":"Jakk Card","sell":10},{"name":"Pumpkin Lantern","sell":243},{"name":"Pumpkin-Head","sell":10}]},{"id":1517,"name":"Jing Guai","items":[{"name":"Tiger Panty","sell":149},{"name":"Little Ghost Doll","sell":605},{"name":"Club","sell":60},{"name":"Spike","sell":10},{"name":"Jing Guai Card","sell":10}]},{"id":1131,"name":"Joker","items":[{"name":"Zargon","sell":240},{"name":"Old Card Album","sell":5000},{"name":"Contract in Shadow","sell":50},{"name":"Yellow Herb","sell":20},{"name":"Katar of Piercing Wind","sell":22500},{"name":"Oridecon","sell":550},{"name":"Level 5 Soul Strike","sell":1000},{"name":"Joker Card","sell":10}]},{"id":1072,"name":"Kaho","items":[{"name":"Flame Heart","sell":1500},{"name":"Coal","sell":250},{"name":"Burning Heart","sell":462},{"name":"Level 3 Fire Bolt","sell":500},{"name":"Rough Elunium","sell":325},{"name":"Red Gemstone","sell":300},{"name":"Alcohol","sell":200},{"name":"Kaho Card","sell":10}]},{"id":1406,"name":"Kapha","items":[{"name":"Yellow Plate","sell":110},{"name":"Cyfar","sell":386},{"name":"Huuma Calm Mind","sell":10},{"name":"Aloe Leaflet","sell":180},{"name":"Ment","sell":250},{"name":"Loner's Guitar","sell":10},{"name":"Jitte","sell":10000},{"name":"Kapha Card","sell":10}]},{"id":1400,"name":"Karakasa","items":[{"name":"Oil Paper","sell":105},{"name":"Piece of Bamboo","sell":155},{"name":"Trunk","sell":30},{"name":"Slick Paper","sell":353},{"name":"Zargon","sell":240},{"name":"Glass Bead","sell":700},{"name":"Murasame","sell":10},{"name":"Karakasa Card","sell":10}]},{"id":1833,"name":"Kasa","items":[{"name":"Burning Heart","sell":462},{"name":"Burning Hair","sell":487},{"name":"Flame Heart","sell":1500},{"name":"Lesser Elemental Ring","sell":10},{"name":"Lucius's Fierce Armor of Volcano","sell":68000},{"name":"Burning Bow","sell":10},{"name":"Piercing Staff","sell":10},{"name":"Kasa Card","sell":10}]},{"id":1639,"name":"Kathryne Keyron","items":[{"name":"Handcuffs","sell":362},{"name":"Old Blue Box","sell":5000},{"name":"La'cryma Stick","sell":10},{"name":"Survivor's Rod","sell":42500},{"name":"Guard","sell":250},{"name":"Small Ribbons","sell":10},{"name":"Shoes","sell":1750},{"name":"Kathryne Keyron Card","sell":10}]},{"id":1656,"name":"Kavach Icarus","items":[{"name":"Research Chart","sell":420},{"name":"Gakkung Bow","sell":21000},{"name":"Steel Arrow Quiver","sell":1},{"name":"Great Bow","sell":5000},{"name":"Mantle","sell":5000},{"name":"Sandals","sell":200},{"name":"Shoes","sell":1750},{"name":"Kavach Icarus Card","sell":10},{"name":"Gift Box","sell":500}]},{"id":1132,"name":"Khalitzburg","items":[{"name":"Skel-Bone","sell":116},{"name":"Elunium","sell":550},{"name":"Bone Helm","sell":10},{"name":"Mirror Shield","sell":30000},{"name":"Chivalry Emblem","sell":1},{"name":"White Herb","sell":60},{"name":"Saber","sell":24500},{"name":"Khalitzburg Card","sell":10}]},{"id":1734,"name":"Kiel D-01","items":[{"name":"Pocket Watch","sell":1710},{"name":"Old Purple Box","sell":5000},{"name":"Morrigane's Pendant","sell":15000},{"name":"Glittering Jacket","sell":10},{"name":"Survivor's Rod","sell":42500},{"name":"Dagger of Counter","sell":60000},{"name":"Morrigane's Belt","sell":15000},{"name":"Kiel-D-01 Card","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"Old Card Album","sell":5000}]},{"id":1294,"name":"Killer Mantis","items":[{"name":"Mantis Scythe","sell":98},{"name":"Solid Shell","sell":224},{"name":"Emerald","sell":3000},{"name":"White Herb","sell":60},{"name":"Grape","sell":100},{"name":"Loki's Nail","sell":10},{"name":"Mirror Shield","sell":30000},{"name":"Killer Mantis Card","sell":10}]},{"id":1838,"name":"Knocker","items":[{"name":"Great Nature","sell":1500},{"name":"Coal","sell":250},{"name":"Elder Pixie's Moustache","sell":116},{"name":"Elven Ears","sell":10},{"name":"Ribbon","sell":400},{"name":"Thorny Buckler","sell":10},{"name":"Earth Bow","sell":10},{"name":"Knocker Card","sell":10}]},{"id":1133,"name":"Kobold","items":[{"name":"Steel","sell":500},{"name":"Blue Hair","sell":171},{"name":"Zargon","sell":240},{"name":"Rough Elunium","sell":325},{"name":"Gladius","sell":21500},{"name":"Buckler","sell":7000},{"name":"Kobold Card","sell":10},{"name":"Yellow Herb","sell":20},{"name":"Guard","sell":250},{"name":"Red Blood","sell":500},{"name":"Hammer","sell":7750}]},{"id":1282,"name":"Kobold Archer","items":[{"name":"Zargon","sell":240},{"name":"Steel","sell":500},{"name":"Blue Hair","sell":171},{"name":"Puppy Headband","sell":10},{"name":"Poison Arrow","sell":5},{"name":"Crossbow","sell":8500},{"name":"Rough Oridecon","sell":275},{"name":"Kobold Archer Card","sell":10}]},{"id":1296,"name":"Kobold Leader","items":[{"name":"Steel","sell":500},{"name":"Blue Hair","sell":171},{"name":"Zargon","sell":240},{"name":"Flail","sell":8000},{"name":"Mighty Staff","sell":10},{"name":"Panacea","sell":250},{"name":"Royal Jelly","sell":3500},{"name":"Kobold Leader Card","sell":10}]},{"id":1587,"name":"Kraben","items":[{"name":"Zargon","sell":240},{"name":"Milk","sell":12},{"name":"Aloe Leaflet","sell":180},{"name":"Guard","sell":250},{"name":"Straw Basket","sell":316},{"name":"Red Chile","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"Kraben Card","sell":10}]},{"id":1779,"name":"Ktullanux","items":[{"name":"Ice Scale","sell":1510},{"name":"Old Card Album","sell":5000},{"name":"Survivor's Manteau","sell":10000},{"name":"Sacred Mission","sell":64000},{"name":"Old Purple Box","sell":5000},{"name":"Yggdrasil Berry","sell":2500},{"name":"Ktullanux Card","sell":10}]},{"id":1980,"name":"Kublin","items":[{"name":"Iron","sell":50},{"name":"Scell","sell":80},{"name":"Rough Oridecon","sell":275},{"name":"Goblin Mask","sell":10},{"name":"Red Herb","sell":9},{"name":"Hoe","sell":0}]},{"id":1070,"name":"Kukre","items":[{"name":"Crystal Blue","sell":500},{"name":"Worm Peeling","sell":26},{"name":"Garlet","sell":20},{"name":"Monster's Feed","sell":30},{"name":"Red Herb","sell":9},{"name":"Insect Feeler","sell":57},{"name":"Earthworm the Dude","sell":2000},{"name":"Kukre Card","sell":10}]},{"id":1703,"name":"Lady Solace","items":[{"name":"Blue Feather","sell":704},{"name":"Ring","sell":15000},{"name":"Stone of Sage","sell":50000},{"name":"Garnet","sell":3000},{"name":"Harp","sell":31000},{"name":"Cursed Seal","sell":666},{"name":"Lady Solace Card","sell":10}]},{"id":1688,"name":"Lady Tanee","items":[{"name":"Steamed Desert Scorpions","sell":50000},{"name":"Tropical Banana","sell":10},{"name":"Fantastic Cooking Kit","sell":5000},{"name":"Banana Hat","sell":10},{"name":"Elunium","sell":550},{"name":"Old Purple Box","sell":5000},{"name":"Gakkung Bow","sell":21000},{"name":"Lady Tanee Card","sell":10},{"name":"Hwergelmir's Tonic","sell":50000},{"name":"3carat Diamond","sell":27500}]},{"id":1657,"name":"Laurell Weinder","items":[{"name":"Memento","sell":300},{"name":"Wing Staff","sell":10},{"name":"Guard","sell":250},{"name":"Staff","sell":4750},{"name":"Silk Robe","sell":4000},{"name":"Silver Robe","sell":3500},{"name":"Clip","sell":15000},{"name":"Laurell Weinder Card","sell":10},{"name":"Gift Box","sell":500}]},{"id":1366,"name":"Lava Golem","items":[{"name":"Lava","sell":554},{"name":"Burning Heart","sell":462},{"name":"Full Plate","sell":40000},{"name":"White Herb","sell":60},{"name":"Magma Fist","sell":10},{"name":"Lava Golem Card","sell":10}]},{"id":1586,"name":"Leaf Cat","items":[{"name":"Huge Leaf","sell":305},{"name":"Hinalle Leaflet","sell":75},{"name":"Yggdrasil Seed","sell":2500},{"name":"Fish Tail","sell":98},{"name":"Lemon","sell":30},{"name":"Shrimp","sell":250},{"name":"Fig Leaf","sell":269},{"name":"Leaf Cat Card","sell":10}]},{"id":1306,"name":"Leib Olmai","items":[{"name":"Bear's Footskin","sell":87},{"name":"Poo Poo Hat","sell":10},{"name":"Puppet","sell":500},{"name":"Honey","sell":250},{"name":"Pocket Watch","sell":10},{"name":"Gold","sell":100000},{"name":"Cyfar","sell":386},{"name":"Leib Olmai Card","sell":10}]},{"id":1881,"name":"Les","items":[{"name":"Sharp Leaf","sell":403},{"name":"Green Herb","sell":5},{"name":"Shoot","sell":8},{"name":"Stem","sell":23},{"name":"Romantic Leaf","sell":10},{"name":"Aloe Leaflet","sell":180},{"name":"Blue Herb","sell":30}]},{"id":1505,"name":"Loli Ruri","items":[{"name":"Black Cat Doll","sell":720},{"name":"Striped Sock","sell":460},{"name":"Bat Cage","sell":440},{"name":"Elunium","sell":550},{"name":"Loki's Whispers","sell":10},{"name":"Lunatic Brooch","sell":10},{"name":"Loli Ruri Card","sell":10}]},{"id":1640,"name":"Lord Knight Seyren","items":[{"name":"Old Purple Box","sell":5000},{"name":"Edge","sell":10},{"name":"Legion Plate Armor","sell":51250},{"name":"Greaves","sell":27000},{"name":"Brionac","sell":10},{"name":"Longinus's Spear","sell":10},{"name":"Dragon Slayer","sell":10},{"name":"Brocca","sell":10},{"name":"Lord Knight Card","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"3carat Diamond","sell":27500},{"name":"Evil Mind","sell":5}]},{"id":1373,"name":"Lord of the Dead","items":[{"name":"Piece of Shield","sell":840},{"name":"Pole Axe","sell":10},{"name":"Ice Pick","sell":10},{"name":"Ring","sell":15000},{"name":"Shining Spear Blade","sell":420},{"name":"War Axe","sell":10},{"name":"Iron Driver","sell":10},{"name":"Lord of The Dead Card","sell":10},{"name":"Yggdrasil Berry","sell":2500},{"name":"3carat Diamond","sell":27500},{"name":"Old Purple Box","sell":5000}]},{"id":1994,"name":"Luciola Vespa","items":[{"name":"Sprint Ring","sell":10},{"name":"Worm Peeling","sell":26},{"name":"Bee Sting","sell":16},{"name":"Honey","sell":250},{"name":"Wind of Verdure","sell":500},{"name":"Royal Jelly","sell":3500},{"name":"Solid Shell","sell":224},{"name":"Luciola Vespa Card","sell":10}]},{"id":1509,"name":"Lude","items":[{"name":"Pumpkin Lantern","sell":243},{"name":"Ectoplasm","sell":161},{"name":"Fabric","sell":153},{"name":"Halo","sell":10},{"name":"Rough Elunium","sell":325},{"name":"Level 3 Heal","sell":1000},{"name":"Lude Card","sell":10}]},{"id":1063,"name":"Lunatic","items":[{"name":"Clover","sell":5},{"name":"Feather","sell":10},{"name":"Clown Nose","sell":10},{"name":"Apple","sell":7},{"name":"Red Herb","sell":9},{"name":"Carrot","sell":7},{"name":"Rainbow Carrot","sell":1250},{"name":"Lunatic Card","sell":10},{"name":"Orange Potion","sell":100}]},{"id":1706,"name":"Maero of Thanatos","items":[{"name":"Brigan","sell":373},{"name":"2carat Diamond","sell":12500},{"name":"3carat Diamond","sell":27500},{"name":"Fragment of Misery","sell":753},{"name":"Old Card Album","sell":5000},{"name":"Goibne's Armor","sell":25000},{"name":"Maero of Thanatos Card","sell":10}]},{"id":2043,"name":"Magic Decoy","items":[{"name":"Steel","sell":500}]},{"id":1836,"name":"Magmaring","items":[{"name":"Burning Heart","sell":462},{"name":"Rough Elunium","sell":325},{"name":"Magmaring Card","sell":10}]},{"id":1138,"name":"Magnolia","items":[{"name":"Old Frying Pan","sell":98},{"name":"Garlet","sell":20},{"name":"Scell","sell":80},{"name":"Zargon","sell":240},{"name":"Black Ladle","sell":200},{"name":"Yellow Herb","sell":20},{"name":"Professional Cooking Kit","sell":1000},{"name":"Magnolia Card","sell":10},{"name":"Leche Flan","sell":1}]},{"id":1310,"name":"Majoruros","items":[{"name":"Nose Ring","sell":284},{"name":"Two-Handed Axe","sell":27500},{"name":"Lemon","sell":30},{"name":"Oridecon","sell":550},{"name":"White Herb","sell":60},{"name":"Silver Ring","sell":10000},{"name":"Star Crumb","sell":2250},{"name":"Majoruros Card","sell":10}]},{"id":1020,"name":"Mandragora","items":[{"name":"Green Live","sell":500},{"name":"Stem","sell":23},{"name":"Spear","sell":850},{"name":"Green Herb","sell":5},{"name":"Shoot","sell":8},{"name":"Four Leaf Clover","sell":40000},{"name":"Gaia Whip","sell":10},{"name":"Mandragora Card","sell":10},{"name":"Langka","sell":1}]},{"id":1139,"name":"Mantis","items":[{"name":"Green Live","sell":500},{"name":"Mantis Scythe","sell":98},{"name":"Scell","sell":80},{"name":"Rough Elunium","sell":325},{"name":"Solid Shell","sell":224},{"name":"Emerald","sell":3000},{"name":"Red Herb","sell":9},{"name":"Mantis Card","sell":10}]},{"id":1513,"name":"Mao Guai","items":[{"name":"Folding Fan of Cat Ghost","sell":233},{"name":"Cat's Eye","sell":477},{"name":"Aloevera","sell":750},{"name":"Fish Tail","sell":98},{"name":"Level 5 Lightening Bolt","sell":1000},{"name":"Mao Guai Card","sell":10}]},{"id":1045,"name":"Marc","items":[{"name":"Mystic Frozen","sell":1500},{"name":"Gill","sell":171},{"name":"Rough Oridecon","sell":275},{"name":"Fin","sell":206},{"name":"Aquamarine","sell":3000},{"name":"Blue Gemstone","sell":300},{"name":"White Herb","sell":60},{"name":"Marc Card","sell":10}]},{"id":1140,"name":"Marduk","items":[{"name":"Flame Heart","sell":1500},{"name":"Cultish Masque","sell":206},{"name":"Staff","sell":4750},{"name":"Celebrant's Mitten","sell":1},{"name":"Wand of Occult","sell":10},{"name":"Level 5 Fire Bolt","sell":1000},{"name":"Book of the Devil","sell":900},{"name":"Marduk Card","sell":10}]},{"id":1637,"name":"Margaretha Sorin","items":[{"name":"Research Chart","sell":420},{"name":"Croce Staff","sell":10},{"name":"Rod","sell":25},{"name":"Hardcover Book","sell":10},{"name":"Holy Robe","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"Muffler","sell":2500},{"name":"Margaretha Sorin Card","sell":10}]},{"id":1242,"name":"Marin","items":[{"name":"Garlet","sell":20},{"name":"Sticky Mucus","sell":35},{"name":"Level 1 Frost Diver","sell":500},{"name":"Aquamarine","sell":3000},{"name":"Blue Herb","sell":30},{"name":"Candy","sell":5},{"name":"Poring Hat","sell":10},{"name":"Marin Card","sell":10},{"name":"Ube Jam","sell":1}]},{"id":1141,"name":"Marina","items":[{"name":"Single Cell","sell":23},{"name":"Sticky Mucus","sell":35},{"name":"Crystal Blue","sell":500},{"name":"Mystic Frozen","sell":1500},{"name":"Blue Gemstone","sell":300},{"name":"Deadly Noxious Herb","sell":10},{"name":"Marina Card","sell":10}]},{"id":1142,"name":"Marine Sphere","items":[{"name":"Tendon","sell":110},{"name":"Detonator","sell":225},{"name":"Chain","sell":11500},{"name":"Aquamarine","sell":3000},{"name":"Blue Gemstone","sell":300},{"name":"Transparent Head Protector","sell":10},{"name":"Marine Sphere Card","sell":10}]},{"id":1143,"name":"Marionette","items":[{"name":"Golden Hair","sell":215},{"name":"Stellar","sell":10},{"name":"Brooch","sell":15000},{"name":"Level 5 Fire Wall","sell":1000},{"name":"Chain","sell":11500},{"name":"Crystal Pumps","sell":10},{"name":"Marionette Doll","sell":10},{"name":"Marionette Card","sell":10}]},{"id":1889,"name":"Marozka's Guard","items":[{"name":"Cyfar","sell":386},{"name":"Ice Cubic","sell":330}]},{"id":1144,"name":"Marse","items":[{"name":"Squid Ink","sell":132},{"name":"Tentacle","sell":35},{"name":"Blue Gemstone","sell":300},{"name":"Aquamarine","sell":3000},{"name":"Mystic Frozen","sell":1500},{"name":"Necklace of Wisdom","sell":1},{"name":"Grape","sell":100},{"name":"Marse Card","sell":10}]},{"id":1145,"name":"Martin","items":[{"name":"Mole Whiskers","sell":53},{"name":"Mole Claw","sell":105},{"name":"Jur","sell":9750},{"name":"Goggles","sell":10},{"name":"Safety Helmet","sell":10},{"name":"Battered Pot","sell":10},{"name":"Martin Card","sell":10},{"name":"Macapuno","sell":1}]},{"id":1090,"name":"Mastering","items":[{"name":"Unicorn Horn","sell":10},{"name":"Unripe Apple","sell":500},{"name":"Pearl","sell":3000},{"name":"Angelic Guard","sell":5000},{"name":"Apple","sell":7},{"name":"Apple Juice","sell":10},{"name":"Mastering Card","sell":10}]},{"id":1801,"name":"Mastersmith Howard","items":[{"name":"Evil Mind","sell":5}]},{"id":1146,"name":"Matyr","items":[{"name":"Matyr's Leash","sell":1},{"name":"Monster's Feed","sell":30},{"name":"Animal Skin","sell":18},{"name":"Pet Food","sell":500},{"name":"Rough Elunium","sell":325},{"name":"Grape","sell":100},{"name":"Matyr Card","sell":10}]},{"id":1884,"name":"Mavka","items":[{"name":"Principles of Magic","sell":10},{"name":"Singing Flower","sell":150},{"name":"Singing Plant","sell":250},{"name":"Illusion Flower","sell":500},{"name":"Crystal Mirror","sell":7500},{"name":"Witherless Rose","sell":27500},{"name":"Blue Herb","sell":30}]},{"id":1147,"name":"Maya","items":[{"name":"Queen's Hair Ornament","sell":10},{"name":"Safety Ring","sell":37500},{"name":"Tiara","sell":10},{"name":"Armlet of Obedience","sell":9000},{"name":"Mother's Nightmare","sell":10},{"name":"Elunium","sell":550},{"name":"Dea Staff","sell":10},{"name":"Maya Card","sell":10},{"name":"1carat Diamond","sell":5000},{"name":"Old Blue Box","sell":5000},{"name":"Old Purple Box","sell":5000}]},{"id":1289,"name":"Maya Purple","items":[{"name":"Cyfar","sell":386},{"name":"Rough Elunium","sell":325},{"name":"Rough Oridecon","sell":275},{"name":"Gold","sell":100000},{"name":"Oridecon","sell":550},{"name":"Queen's Hair Ornament","sell":10},{"name":"Level 10 Cookbook","sell":500},{"name":"Maya Purple Card","sell":10}]},{"id":1148,"name":"Medusa","items":[{"name":"Horrendous Hair","sell":400},{"name":"Red Flame Whip","sell":10},{"name":"Animal Gore","sell":225},{"name":"Sea Witch's Foot","sell":10},{"name":"Pearl","sell":3000},{"name":"Turtle Shell","sell":340},{"name":"Necklace of Wisdom","sell":1},{"name":"Medusa Card","sell":10}]},{"id":1274,"name":"Megalith","items":[{"name":"Zargon","sell":240},{"name":"Stone","sell":0},{"name":"Old Purple Box","sell":5000},{"name":"Elunium","sell":550},{"name":"Rough Elunium","sell":325},{"name":"Megalith Card","sell":10}]},{"id":1064,"name":"Megalodon","items":[{"name":"Stinky Scale","sell":84},{"name":"Skel-Bone","sell":116},{"name":"Blue Herb","sell":30},{"name":"Blue Gemstone","sell":300},{"name":"Amethyst","sell":3000},{"name":"Old Blue Box","sell":5000},{"name":"Rotten Fish","sell":1250},{"name":"Megalodon Card","sell":10}]},{"id":1708,"name":"Memory of Thanatos","items":[{"name":"Treasure Box","sell":150000},{"name":"Morrigane's Manteau","sell":15000},{"name":"Skeletal Armor Piece","sell":1025},{"name":"Legion Plate Armor","sell":51250},{"name":"Greaves","sell":27000},{"name":"Eagle Wing","sell":10000},{"name":"Bloodied Shackle Ball","sell":25000},{"name":"Memory of Thanatos Card","sell":10},{"name":"Old Purple Box","sell":5000},{"name":"Old Blue Box","sell":5000},{"name":"3carat Diamond","sell":27500}]},{"id":1264,"name":"Merman","items":[{"name":"Ancient Lips","sell":500},{"name":"Holy Water","sell":10},{"name":"Lemon","sell":30},{"name":"Aquamarine","sell":3000},{"name":"Mystic Frozen","sell":1500},{"name":"Trident","sell":25500},{"name":"Rough Oridecon","sell":275},{"name":"Merman Card","sell":10}]},{"id":1613,"name":"Metaling","items":[{"name":"Flexible Tube","sell":51},{"name":"Iron Ore","sell":25},{"name":"Iron","sell":50},{"name":"Large Jellopy","sell":420},{"name":"Rusty Screw","sell":267},{"name":"Crimson Bolt","sell":10000},{"name":"Jubilee","sell":16},{"name":"Metaling Card","sell":10}]},{"id":1058,"name":"Metaller","items":[{"name":"Red Blood","sell":500},{"name":"Grasshopper's Leg","sell":18},{"name":"Scell","sell":80},{"name":"Rough Elunium","sell":325},{"name":"Singing Plant","sell":250},{"name":"Shell","sell":7},{"name":"Burning Passion Guitar","sell":10},{"name":"Metaller Card","sell":10}]},{"id":1516,"name":"Mi Gao","items":[{"name":"Dry Sand","sell":161},{"name":"Mud Lump","sell":438},{"name":"Great Nature","sell":1500},{"name":"Gold","sell":100000},{"name":"Mi Gao Card","sell":10}]},{"id":1585,"name":"Mime Monkey","items":[{"name":"Jellopy","sell":3},{"name":"Knife","sell":25},{"name":"Sticky Mucus","sell":35},{"name":"Apple","sell":7},{"name":"Empty Bottle","sell":3},{"name":"Poring Doll","sell":900},{"name":"Unripe Apple","sell":500}]},{"id":1191,"name":"Mimic","items":[{"name":"Old Purple Box","sell":5000},{"name":"Old Blue Box","sell":5000},{"name":"Trap","sell":50},{"name":"Magnifier","sell":20},{"name":"Emperium","sell":1},{"name":"Rosary","sell":7500},{"name":"Rough Elunium","sell":325},{"name":"Mimic Card","sell":10}]},{"id":1614,"name":"Mineral","items":[{"name":"Crystal Fragment","sell":276},{"name":"Topaz","sell":3000},{"name":"Emperium","sell":1},{"name":"Oridecon","sell":550},{"name":"Emveretarcon","sell":500},{"name":"Yellow Gemstone","sell":300},{"name":"Gold","sell":100000},{"name":"Mineral Card","sell":10}]},{"id":1292,"name":"Mini Demon","items":[{"name":"Little Evil Horn","sell":264},{"name":"Little Evil Wing","sell":1000},{"name":"Evil Wing","sell":10},{"name":"Rough Elunium","sell":325},{"name":"Zargon","sell":240},{"name":"Hand of God","sell":1},{"name":"Ahlspiess","sell":10},{"name":"Mini Demon Card","sell":10}]},{"id":1149,"name":"Minorous","items":[{"name":"Nose Ring","sell":284},{"name":"Rough Oridecon","sell":275},{"name":"Two-Handed Axe","sell":27500},{"name":"Hammer of Blacksmith","sell":1},{"name":"Potato","sell":7},{"name":"Axe","sell":250},{"name":"Lemon","sell":30},{"name":"Minorous Card","sell":10}]},{"id":1059,"name":"Mistress","items":[{"name":"Gungnir","sell":10},{"name":"Honey","sell":250},{"name":"Coronet","sell":10},{"name":"Old Card Album","sell":5000},{"name":"Young Twig","sell":25},{"name":"Elunium","sell":550},{"name":"Red Square Bag","sell":10},{"name":"Mistress Card","sell":10},{"name":"Rough Wind","sell":1500},{"name":"Royal Jelly","sell":3500},{"name":"Pearl","sell":3000}]},{"id":1701,"name":"Mistress of Shelter","items":[{"name":"Red Feather","sell":667},{"name":"Cursed Seal","sell":666},{"name":"Stone of Sage","sell":50000},{"name":"Pearl","sell":3000},{"name":"Skull","sell":522},{"name":"Mistress of Shelter Card","sell":10}]},{"id":1404,"name":"Miyabi Doll","items":[{"name":"Glossy Hair","sell":170},{"name":"Worn-out Kimono","sell":295},{"name":"White Herb","sell":60},{"name":"Star Crumb","sell":2250},{"name":"Professional Cooking Kit","sell":1000},{"name":"Hakujin","sell":10},{"name":"Mandolin","sell":9000},{"name":"Miyabi Doll Card","sell":10}]},{"id":1313,"name":"Mobster","items":[{"name":"Poison Knife","sell":10},{"name":"Sapphire","sell":3000},{"name":"Ring","sell":15000},{"name":"Red Gemstone","sell":300},{"name":"Zargon","sell":240},{"name":"Panacea","sell":250},{"name":"Blue Potion","sell":2500},{"name":"Mobster Card","sell":10}]},{"id":1674,"name":"Monemus","items":[{"name":"Stone","sell":0},{"name":"Stone Heart","sell":92}]},{"id":1150,"name":"Moonlight Flower","items":[{"name":"Spectral Spear","sell":10},{"name":"Moonlight Dagger","sell":10},{"name":"Long Mace","sell":10},{"name":"Punisher","sell":10},{"name":"Silver Knife of Chastity","sell":6000},{"name":"Elunium","sell":550},{"name":"Staff Of Bordeaux","sell":10},{"name":"Moonlight Flower Card","sell":10},{"name":"Nine Tails","sell":325},{"name":"White Potion","sell":600},{"name":"Topaz","sell":3000}]},{"id":1055,"name":"Muka","items":[{"name":"Green Live","sell":500},{"name":"Cactus Needle","sell":41},{"name":"Empty Bottle","sell":3},{"name":"Green Herb","sell":5},{"name":"Red Herb","sell":9},{"name":"Guisarme","sell":6500},{"name":"Iron Ore","sell":25},{"name":"Muka Card","sell":10},{"name":"Kaong","sell":1}]},{"id":1041,"name":"Mummy","items":[{"name":"Rotten Bandage","sell":175},{"name":"Rough Oridecon","sell":275},{"name":"Memento","sell":300},{"name":"Glove","sell":15000},{"name":"Silver Ring","sell":10000},{"name":"Panacea","sell":250},{"name":"Yellow Herb","sell":20},{"name":"Mummy Card","sell":10}]},{"id":1026,"name":"Munak","items":[{"name":"Daenggie","sell":130},{"name":"Munak Hat","sell":10},{"name":"Shoes","sell":1750},{"name":"Amulet","sell":50},{"name":"Ninja Suit","sell":10},{"name":"Adventurer's Suit","sell":500},{"name":"Girl's Diary","sell":750},{"name":"Munak Card","sell":10},{"name":"Orange Potion","sell":100},{"name":"Slow Potion","sell":1},{"name":"Speed Potion","sell":1}]},{"id":1780,"name":"Muscipular","items":[{"name":"Sticky Poison","sell":175},{"name":"Maneater Blossom","sell":98},{"name":"Singing Flower","sell":150},{"name":"Maneater Root","sell":104},{"name":"Stem","sell":23},{"name":"Deadly Noxious Herb","sell":10},{"name":"Muscipular Card","sell":10}]},{"id":1262,"name":"Mutant Dragonoid","items":[{"name":"Brigan","sell":373},{"name":"Dragon Canine","sell":242},{"name":"Dragon Scale","sell":250},{"name":"Rotten Bandage","sell":175},{"name":"Legacy of Dragon","sell":10},{"name":"Pyroxene","sell":1500},{"name":"Dragon Breath","sell":10},{"name":"Mutant Dragonoid Card","sell":10}]},{"id":1151,"name":"Myst","items":[{"name":"Gas Mask","sell":10},{"name":"Trunk","sell":30},{"name":"Wig","sell":10},{"name":"Rough Oridecon","sell":275},{"name":"Rough Elunium","sell":325},{"name":"Anodyne","sell":1000},{"name":"Grape","sell":100},{"name":"Myst Card","sell":10},{"name":"Wooden Block","sell":10}]},{"id":1249,"name":"Myst Case","items":[{"name":"Candy Cane","sell":10},{"name":"Zargon","sell":240},{"name":"Old Blue Box","sell":5000},{"name":"Piece of Cake","sell":1500},{"name":"Pearl","sell":3000},{"name":"2carat Diamond","sell":12500},{"name":"Candy","sell":5},{"name":"Myst Case Card","sell":10}]},{"id":1203,"name":"Mysteltainn","items":[{"name":"Loki's Whispers","sell":10},{"name":"Biotite","sell":1500},{"name":"Slayer","sell":7500},{"name":"Bastard Sword","sell":11250},{"name":"Claymore","sell":37000},{"name":"Steel","sell":500},{"name":"Oridecon","sell":550},{"name":"Mysteltainn Card","sell":10}]},{"id":1993,"name":"Naga","items":[{"name":"Armor of Naga","sell":10},{"name":"Shield of Naga","sell":10},{"name":"Battle Fork","sell":10},{"name":"Snake Scale","sell":41},{"name":"Scale Shell","sell":233},{"name":"Shining Scale","sell":233},{"name":"Pike","sell":1725}]},{"id":1956,"name":"Naght Sieger","items":[{"name":"Twin Edge of Naght Sieger","sell":10},{"name":"Flame Manteau of Naght Sieger","sell":10},{"name":"Bone Helm","sell":10},{"name":"Old Card Album","sell":5000},{"name":"Pauldron","sell":10},{"name":"Turquoise","sell":1500}]},{"id":1870,"name":"Necromancer","items":[{"name":"Clattering Skull","sell":420},{"name":"Lich's Bone Wand","sell":10},{"name":"Skel-Bone","sell":116},{"name":"Mithril Magic Cape","sell":10},{"name":"Blue Gemstone","sell":300},{"name":"Amulet","sell":50},{"name":"Torn Magic Book","sell":571},{"name":"Necromancer Card","sell":10}]},{"id":1988,"name":"Nepenthes","items":[{"name":"Mandragora Cap","sell":10},{"name":"Stem of Nepenthes","sell":10},{"name":"Harp of Nepenthes","sell":10},{"name":"Nepenthes Bow","sell":10},{"name":"Strong Vine","sell":15},{"name":"Green Live","sell":500},{"name":"Stem","sell":23}]},{"id":1255,"name":"Nereid","items":[{"name":"Earthworm Peeling","sell":98},{"name":"Cyfar","sell":386},{"name":"Blue Herb","sell":30},{"name":"Icicle Whip","sell":10},{"name":"Grape","sell":100},{"name":"Rough Elunium","sell":325},{"name":"Elunium","sell":550},{"name":"Nereid Card","sell":10}]},{"id":2022,"name":"Nidhoggr's Shadow","items":[{"name":"Dark Red Scale","sell":100000},{"name":"Treasure Box","sell":150000},{"name":"Gold Ring","sell":15000},{"name":"Cardo","sell":10},{"name":"Katzbalger","sell":10},{"name":"Pole Axe","sell":10},{"name":"Nydhorgg's Shadow Garb","sell":10},{"name":"Old Purple Box","sell":5000},{"name":"Old Card Album","sell":5000}]},{"id":1061,"name":"Nightmare","items":[{"name":"Horseshoe","sell":294},{"name":"Blue Herb","sell":30},{"name":"Rosary","sell":7500},{"name":"Old Blue Box","sell":5000},{"name":"Blue Potion","sell":2500},{"name":"Infiltrator","sell":28500},{"name":"Oridecon","sell":550},{"name":"Nightmare Card","sell":10},{"name":"Battle Test Certificate","sell":0}]},{"id":1379,"name":"Nightmare Terror","items":[{"name":"Burning Horseshoe","sell":411},{"name":"Rosary","sell":7500},{"name":"Blue Potion","sell":2500},{"name":"Blue Herb","sell":30},{"name":"Level 5 Soul Strike","sell":1000},{"name":"Infiltrator","sell":28500},{"name":"Nightmare Terror Card","sell":10}]},{"id":1180,"name":"Nine Tail","items":[{"name":"Nine Tails","sell":325},{"name":"Glass Bead","sell":700},{"name":"Old Blue Box","sell":5000},{"name":"Dead Branch","sell":25},{"name":"Royal Jelly","sell":3500},{"name":"Panacea","sell":250},{"name":"Rough Oridecon","sell":275},{"name":"Nine Tail Card","sell":10}]},{"id":1715,"name":"Novus","items":[{"name":"Green Herb","sell":5},{"name":"Cyfar","sell":386},{"name":"Dragon Scale","sell":250},{"name":"Red Novus Card","sell":10},{"name":"Yellow Herb","sell":20},{"name":"Yellow Novus Card","sell":10}]},{"id":1620,"name":"Noxious","items":[{"name":"Toxic Gas","sell":333},{"name":"Mould Powder","sell":233},{"name":"Anodyne","sell":1000},{"name":"Dust Pollutant","sell":128},{"name":"Old Blue Box","sell":5000},{"name":"Noxious Card","sell":10}]},{"id":1044,"name":"Obeaune","items":[{"name":"Mystic Frozen","sell":1500},{"name":"Heart of Mermaid","sell":132},{"name":"Fin Helm","sell":10},{"name":"Saint's Robe","sell":27000},{"name":"Aquamarine","sell":3000},{"name":"Fin","sell":206},{"name":"Witherless Rose","sell":27500},{"name":"Obeaune Card","sell":10}]},{"id":1970,"name":"Obeune","items":[{"name":"Mystic Frozen","sell":1500},{"name":"Heart of Mermaid","sell":132},{"name":"Fin Helm","sell":10},{"name":"Saint's Robe","sell":27000},{"name":"Aquamarine","sell":3000},{"name":"Fin","sell":206},{"name":"Witherless Rose","sell":27500},{"name":"Obeaune Card","sell":10}]},{"id":1615,"name":"Obsidian","items":[{"name":"Dark Crystal Fragment","sell":211},{"name":"1carat Diamond","sell":5000},{"name":"Coal","sell":250},{"name":"Elunium","sell":550},{"name":"Steel","sell":500},{"name":"Unholy Touch","sell":10},{"name":"Obsidian Card","sell":10}]},{"id":1704,"name":"Odium of Thanatos","items":[{"name":"Brigan","sell":373},{"name":"2carat Diamond","sell":12500},{"name":"3carat Diamond","sell":27500},{"name":"Fragment of Hatred","sell":753},{"name":"Old Card Album","sell":5000},{"name":"Goibne's Spaulders","sell":15000},{"name":"Odium of Thanatos Card","sell":10}]},{"id":1204,"name":"Ogretooth","items":[{"name":"Old Hilt","sell":75},{"name":"Silver Knife of Chastity","sell":6000},{"name":"Muscovite","sell":1500},{"name":"Dagger","sell":7000},{"name":"Stiletto","sell":9750},{"name":"Steel","sell":500},{"name":"Oridecon","sell":550},{"name":"Ogretooth Card","sell":10}]},{"id":1617,"name":"Old Stove","items":[{"name":"Battered Kettle","sell":128},{"name":"Burnt Tree","sell":361},{"name":"Iron","sell":50},{"name":"Rusty Iron","sell":50},{"name":"Iron Ore","sell":25},{"name":"Dead Branch","sell":25},{"name":"Used Iron Plate","sell":512},{"name":"Waste Stove Card","sell":10}]},{"id":1189,"name":"Orc Archer","items":[{"name":"Fang","sell":340},{"name":"Steel Arrow","sell":2},{"name":"Stone Arrow","sell":1},{"name":"Arrow of Wind","sell":1},{"name":"Orc Archer Bow","sell":10},{"name":"Red Herb","sell":9},{"name":"White Herb","sell":60},{"name":"Orc Archer Card","sell":10}]},{"id":1686,"name":"Orc Baby","items":[{"name":"Large Jellopy","sell":420},{"name":"Pacifier","sell":10},{"name":"Orc Helm","sell":10},{"name":"Milk","sell":12},{"name":"Nursing Bottle","sell":550},{"name":"Pinafore","sell":480},{"name":"Orc Baby Card","sell":10}]},{"id":1087,"name":"Orc Hero","items":[{"name":"Heroic Emblem","sell":1500},{"name":"Monkey Circlet","sell":10},{"name":"Light Epsilon","sell":10},{"name":"Shield","sell":28000},{"name":"Orcish Sword","sell":10},{"name":"Elunium","sell":550},{"name":"Giant Axe","sell":10},{"name":"Orc Hero Card","sell":10},{"name":"Sardonyx","sell":3000},{"name":"Yggdrasil Berry","sell":2500},{"name":"Steel","sell":500}]},{"id":1273,"name":"Orc Lady","items":[{"name":"Cyfar","sell":386},{"name":"Iron","sell":50},{"name":"Earring","sell":15000},{"name":"Wedding Veil","sell":11500},{"name":"Professional Cooking Kit","sell":1000},{"name":"Level 6 Cookbook","sell":500},{"name":"Wedding Dress","sell":21500},{"name":"Orc Lady Card","sell":10}]},{"id":1190,"name":"Orc Lord","items":[{"name":"Bloody Axe","sell":10},{"name":"Ring","sell":15000},{"name":"Grand Circlet","sell":10},{"name":"Doom Slayer","sell":10},{"name":"Old Purple Box","sell":5000},{"name":"Elunium","sell":550},{"name":"Erde","sell":10},{"name":"Orc Lord Card","sell":10},{"name":"Heroic Emblem","sell":1500}]},{"id":1152,"name":"Orc Skeleton","items":[{"name":"Orc's Fang","sell":110},{"name":"Skel-Bone","sell":116},{"name":"Rough Elunium","sell":325},{"name":"Orc Helm","sell":10},{"name":"Buster","sell":17000},{"name":"Green Herb","sell":5},{"name":"Orc Skeleton Card","sell":10}]},{"id":1023,"name":"Orc Warrior","items":[{"name":"Iron","sell":50},{"name":"Orcish Voucher","sell":71},{"name":"Rough Oridecon","sell":275},{"name":"Cigarette","sell":10},{"name":"Battle Axe","sell":2700},{"name":"Orcish Axe","sell":10},{"name":"Axe","sell":250},{"name":"Orc Warrior Card","sell":10}]},{"id":1153,"name":"Orc Zombie","items":[{"name":"Orc Claw","sell":84},{"name":"Sticky Mucus","sell":35},{"name":"Emperium","sell":1},{"name":"Orc Zombie Card","sell":10}]},{"id":1038,"name":"Osiris","items":[{"name":"Old Purple Box","sell":5000},{"name":"Assassin Dagger","sell":10},{"name":"Crown","sell":10},{"name":"Jamadhar","sell":18600},{"name":"Hand of God","sell":1},{"name":"Sphinx Hat","sell":10},{"name":"Chakram","sell":10},{"name":"Osiris Card","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"Yggdrasil Seed","sell":2500},{"name":"Osiris Doll","sell":7000}]},{"id":1295,"name":"Owl Baron","items":[{"name":"Tattered Clothes","sell":640},{"name":"Soft Feather","sell":140},{"name":"Gakkung Bow","sell":21000},{"name":"Soul Staff","sell":10},{"name":"Gentleman's Staff","sell":10},{"name":"Level 5 Lightening Bolt","sell":1000},{"name":"Magician Hat","sell":10},{"name":"Owl Baron Card","sell":10}]},{"id":1320,"name":"Owl Duke","items":[{"name":"Tattered Clothes","sell":640},{"name":"Soft Feather","sell":140},{"name":"Level 5 Lightening Bolt","sell":1000},{"name":"Crystal Mirror","sell":7500},{"name":"Guisarme","sell":6500},{"name":"Morning Star","sell":20500},{"name":"Magician Hat","sell":10},{"name":"Owl Duke Card","sell":10}]},{"id":1308,"name":"Panzer Goblin","items":[{"name":"Cyfar","sell":386},{"name":"Brigan","sell":373},{"name":"Steel","sell":500},{"name":"Iron","sell":50},{"name":"Coal","sell":250},{"name":"Butcher","sell":65000},{"name":"Flame Heart","sell":1500},{"name":"Panzer Goblin Card","sell":10}]},{"id":1500,"name":"Parasite","items":[{"name":"Sprout","sell":115},{"name":"Soft Blade of Grass","sell":200},{"name":"Thin Trunk","sell":190},{"name":"Huge Leaf","sell":305},{"name":"Rante Whip","sell":16000},{"name":"Blade Whip","sell":10},{"name":"Shoot","sell":8},{"name":"Parasite Card","sell":10}]},{"id":1154,"name":"Pasana","items":[{"name":"Broken Sword","sell":294},{"name":"Honey Pot","sell":311},{"name":"Rough Elunium","sell":325},{"name":"Falchion","sell":750},{"name":"Stiletto","sell":9750},{"name":"Undershirt","sell":10000},{"name":"Pasana Card","sell":10}]},{"id":1019,"name":"Peco Peco","items":[{"name":"Bill of Birds","sell":32},{"name":"Sandals","sell":200},{"name":"Yellow Herb","sell":20},{"name":"Red Herb","sell":9},{"name":"Wand","sell":1250},{"name":"Orange","sell":150},{"name":"Peco Peco Card","sell":10}]},{"id":1047,"name":"Peco Peco Egg","items":[{"name":"Phracon","sell":100},{"name":"Shell","sell":7},{"name":"Guard","sell":250},{"name":"Red Herb","sell":9},{"name":"Empty Bottle","sell":3},{"name":"China","sell":500},{"name":"Peco Peco Egg Card","sell":10}]},{"id":1216,"name":"Penomena","items":[{"name":"Coral Reef","sell":386},{"name":"Tentacle","sell":35},{"name":"Sticky Mucus","sell":35},{"name":"Panacea","sell":250},{"name":"Amethyst","sell":3000},{"name":"Katar of Raging Blaze","sell":22500},{"name":"Red Gemstone","sell":300},{"name":"Penomena Card","sell":10}]},{"id":1314,"name":"Permeter","items":[{"name":"Turtle Shell","sell":340},{"name":"Broken Shell","sell":450},{"name":"Trunk","sell":30},{"name":"Red Herb","sell":9},{"name":"Zargon","sell":240},{"name":"Mastela Fruit","sell":4250},{"name":"Anodyne","sell":1000},{"name":"Permeter Card","sell":10}]},{"id":1256,"name":"Pest","items":[{"name":"Earthworm Peeling","sell":98},{"name":"Brigan","sell":373},{"name":"Animal Gore","sell":225},{"name":"Anodyne","sell":1000},{"name":"Red Gemstone","sell":300},{"name":"Rough Oridecon","sell":275},{"name":"Pest Card","sell":10}]},{"id":1155,"name":"Petite","items":[{"name":"Dragon Canine","sell":242},{"name":"Dragon Tail","sell":600},{"name":"Rough Oridecon","sell":275},{"name":"White Herb","sell":60},{"name":"Flail","sell":8000},{"name":"Zargon","sell":240},{"name":"Aloevera","sell":750},{"name":"Earth Petite Card","sell":10},{"name":"Dragon Scale","sell":250},{"name":"Elunium","sell":550},{"name":"Khukri","sell":120000},{"name":"Sky Petite Card","sell":10}]},{"id":1157,"name":"Pharaoh","items":[{"name":"Broken Pharaoh Emblem","sell":1008},{"name":"Masque of Tutankhamen","sell":5},{"name":"Solar Sword","sell":10},{"name":"Holy Robe","sell":10},{"name":"Jewel Crown","sell":10},{"name":"Tablet","sell":25500},{"name":"Bazerald","sell":10},{"name":"Pharaoh Card","sell":10},{"name":"Yggdrasil Berry","sell":2500},{"name":"Royal Jelly","sell":3500},{"name":"3carat Diamond","sell":27500}]},{"id":1158,"name":"Phen","items":[{"name":"Fish Tail","sell":98},{"name":"Sharp Scale","sell":125},{"name":"Aquamarine","sell":3000},{"name":"Meat","sell":25},{"name":"Fin","sell":206},{"name":"Rough Oridecon","sell":275},{"name":"Phen Card","sell":10}]},{"id":1202,"name":"Phendark","items":[{"name":"Tongue","sell":264},{"name":"Executioner's Mitten","sell":2250},{"name":"White Herb","sell":60},{"name":"Oridecon","sell":550},{"name":"Electric Wire","sell":10},{"name":"Phendark Card","sell":10}]},{"id":1664,"name":"Photon Cannon","items":[{"name":"Large Jellopy","sell":420},{"name":"Garnet","sell":3000},{"name":"Sticky Mucus","sell":35},{"name":"Sapphire","sell":3000},{"name":"Destroyer","sell":55000},{"name":"Emerald","sell":3000},{"name":"Topaz","sell":3000}]},{"id":1159,"name":"Phreeoni","items":[{"name":"Tongue","sell":264},{"name":"Fortune Sword","sell":10},{"name":"Sucsamad","sell":10},{"name":"Ant Jaw","sell":116},{"name":"Mr. Scream","sell":10},{"name":"Elunium","sell":550},{"name":"Weihna","sell":10},{"name":"Phreeoni Card","sell":10},{"name":"Necklace of Oblivion","sell":1},{"name":"1carat Diamond","sell":5000},{"name":"Star Crumb","sell":2250}]},{"id":2021,"name":"Phylla","items":[{"name":"Fluorescent Liquid","sell":356},{"name":"Detrimindexta","sell":200},{"name":"Spiritual Crystal","sell":525}]},{"id":1049,"name":"Picky","items":[{"name":"Feather of Birds","sell":5},{"name":"Feather","sell":10},{"name":"Cotton Shirt","sell":5},{"name":"Red Herb","sell":9},{"name":"Milk","sell":12},{"name":"Yellow Gemstone","sell":300},{"name":"Picky Card","sell":10},{"name":"Egg Shell","sell":10},{"name":"Tiny Egg Shell","sell":10},{"name":"Picky Egg Card","sell":10}]},{"id":1160,"name":"Piere","items":[{"name":"Worm Peeling","sell":26},{"name":"Garlet","sell":20},{"name":"Sticky Mucus","sell":35},{"name":"Wind of Verdure","sell":500},{"name":"Star Dust","sell":750},{"name":"Iron Ore","sell":25},{"name":"Rough Elunium","sell":325},{"name":"Andre Card","sell":10}]},{"id":1995,"name":"Pinguicula","items":[{"name":"Pinguicula Corsage","sell":10},{"name":"Whip of Balance","sell":10},{"name":"Romantic Leaf","sell":10},{"name":"Sharp Leaf","sell":403},{"name":"Huge Leaf","sell":305},{"name":"Brown Root","sell":280},{"name":"Flower","sell":1}]},{"id":2070,"name":"Piranha","items":[{"name":"Gill","sell":171},{"name":"Mystic Frozen","sell":1500},{"name":"Sharp Scale","sell":125},{"name":"Ancient Tooth","sell":274},{"name":"Ancient Lips","sell":500},{"name":"Scalpel","sell":10},{"name":"Fisherman's Dagger","sell":5000}]},{"id":1071,"name":"Pirate Skeleton","items":[{"name":"Skel-Bone","sell":116},{"name":"Pirate Bandana","sell":10},{"name":"Level 6 Cookbook","sell":500},{"name":"Bandana","sell":200},{"name":"Falchion","sell":750},{"name":"Rough Oridecon","sell":275},{"name":"Well-Dried Bone","sell":5000},{"name":"Pirate Skeleton Card","sell":10}]},{"id":1616,"name":"Pitman","items":[{"name":"Old Pick","sell":256},{"name":"Used Iron Plate","sell":512},{"name":"Iron","sell":50},{"name":"Steel","sell":500},{"name":"Coal","sell":250},{"name":"Lantern","sell":125},{"name":"Flashlight","sell":512},{"name":"Pitman Card","sell":10}]},{"id":1161,"name":"Plankton","items":[{"name":"Single Cell","sell":23},{"name":"Garlet","sell":20},{"name":"Sticky Mucus","sell":35},{"name":"Alcohol","sell":200},{"name":"Empty Bottle","sell":3},{"name":"Dew Laden Moss","sell":5},{"name":"Concentration Potion","sell":400},{"name":"Plankton Card","sell":10},{"name":"Sago","sell":1}]},{"id":1693,"name":"Plasma","items":[{"name":"Scell","sell":80},{"name":"Gift Box","sell":500},{"name":"2carat Diamond","sell":12500},{"name":"Yellow Gemstone","sell":300},{"name":"Gold","sell":100000},{"name":"Plasma Card","sell":10},{"name":"Red Gemstone","sell":300},{"name":"Red Blood","sell":500},{"name":"Blue Gemstone","sell":300},{"name":"Green Live","sell":500},{"name":"Cursed Ruby","sell":300},{"name":"Crystal Blue","sell":500}]},{"id":1077,"name":"Poison Spore","items":[{"name":"Poison Spore","sell":57},{"name":"Hat","sell":500},{"name":"Green Herb","sell":5},{"name":"Blue Herb","sell":30},{"name":"Karvodailnirol","sell":200},{"name":"Mushroom Spore","sell":18},{"name":"Zargon","sell":240},{"name":"Poison Spore Card","sell":10},{"name":"Gulaman","sell":1}]},{"id":1402,"name":"Poison Toad","items":[{"name":"Poisonous Toad Skin","sell":140},{"name":"Poisonous Powder","sell":80},{"name":"Gold Ring","sell":15000},{"name":"Green Herb","sell":5},{"name":"Cursed Ruby","sell":300},{"name":"Royal Jelly","sell":3500},{"name":"Cinquedea","sell":20000},{"name":"Poisonous Toad Card","sell":10}]},{"id":1031,"name":"Poporing","items":[{"name":"Sticky Mucus","sell":35},{"name":"Garlet","sell":20},{"name":"Green Herb","sell":5},{"name":"Grape","sell":100},{"name":"Apple","sell":7},{"name":"Main Gauche","sell":1200},{"name":"Poporing Card","sell":10}]},{"id":1619,"name":"Porcellio","items":[{"name":"Jubilee","sell":16},{"name":"Main Gauche","sell":1200},{"name":"Insect Feeler","sell":57},{"name":"Single Cell","sell":23},{"name":"Dew Laden Moss","sell":5},{"name":"Fluorescent Liquid","sell":356},{"name":"Porcellio Card","sell":10}]},{"id":1002,"name":"Poring","items":[{"name":"Jellopy","sell":3},{"name":"Knife","sell":25},{"name":"Sticky Mucus","sell":35},{"name":"Apple","sell":7},{"name":"Empty Bottle","sell":3},{"name":"Unripe Apple","sell":500},{"name":"Poring Card","sell":10},{"name":"Blessing Of Water","sell":0}]},{"id":1894,"name":"Pouring","items":[{"name":"Cold Medicine","sell":10}]},{"id":1199,"name":"Punk","items":[{"name":"Mould Powder","sell":233},{"name":"Yellow Gemstone","sell":300},{"name":"Pacifier","sell":10},{"name":"Witched Starsand","sell":242},{"name":"Moth Dust","sell":69},{"name":"Fly Wing","sell":30},{"name":"Hood","sell":500},{"name":"Punk Card","sell":10}]},{"id":1008,"name":"Pupa","items":[{"name":"Phracon","sell":100},{"name":"Chrysalis","sell":4},{"name":"Sticky Mucus","sell":35},{"name":"Guard","sell":250},{"name":"Shell","sell":7},{"name":"Iron Ore","sell":25},{"name":"Pupa Card","sell":10}]},{"id":1508,"name":"Quve","items":[{"name":"Piece of Black Cloth","sell":263},{"name":"Ectoplasm","sell":161},{"name":"Fly Wing","sell":30},{"name":"Poisonous Powder","sell":80},{"name":"Rough Oridecon","sell":275},{"name":"Quve Card","sell":10}]},{"id":1162,"name":"Rafflesia","items":[{"name":"Maneater Root","sell":104},{"name":"Scell","sell":80},{"name":"Four Leaf Clover","sell":40000},{"name":"Ment","sell":250},{"name":"Hinalle","sell":250},{"name":"Shoot","sell":8},{"name":"White Herb","sell":60},{"name":"Rafflesia Card","sell":10},{"name":"Yellow Jewel","sell":10},{"name":"Red Jewel","sell":10},{"name":"Blue Jewel","sell":10}]},{"id":1865,"name":"Ragged Zombie","items":[{"name":"Clattering Skull","sell":420},{"name":"Tidal Shoes","sell":10},{"name":"Memento","sell":300},{"name":"Skel-Bone","sell":116},{"name":"Expert Ring","sell":10},{"name":"Wasteland's Outlaw","sell":10},{"name":"Ragged Zombie Card","sell":10}]},{"id":1254,"name":"Raggler","items":[{"name":"Cyfar","sell":386},{"name":"Feather of Birds","sell":5},{"name":"Concentration Potion","sell":400},{"name":"Grape","sell":100},{"name":"Wind of Verdure","sell":500},{"name":"Goggles","sell":10},{"name":"Rough Oridecon","sell":275},{"name":"Raggler Card","sell":10}]},{"id":2017,"name":"Rata","items":[{"name":"Unripe Acorn","sell":0},{"name":"Acorn","sell":49},{"name":"Dark Piece","sell":500},{"name":"Veteran Hammer","sell":5000}]},{"id":1163,"name":"Raydric","items":[{"name":"Elunium","sell":550},{"name":"Iron Cain","sell":10},{"name":"Chain Mail","sell":32500},{"name":"Two-Handed Sword","sell":30000},{"name":"Katana","sell":1000},{"name":"Chivalry Emblem","sell":1},{"name":"Brigan","sell":373},{"name":"Raydric Card","sell":10}]},{"id":1276,"name":"Raydric Archer","items":[{"name":"Brigan","sell":373},{"name":"Chain Mail","sell":32500},{"name":"Bow","sell":500},{"name":"Sharp Arrow","sell":10},{"name":"Arbalest","sell":24000},{"name":"Elunium","sell":550},{"name":"Raydric Archer Card","sell":10}]},{"id":1085,"name":"Red Mushroom","items":[{"name":"Alcohol","sell":200},{"name":"Karvodailnirol","sell":200},{"name":"Dew Laden Moss","sell":5},{"name":"Feather","sell":10},{"name":"Red Blood","sell":500},{"name":"Mushroom Spore","sell":18},{"name":"Poison Spore","sell":57}]},{"id":1078,"name":"Red Plant","items":[{"name":"Red Herb","sell":9},{"name":"Flower","sell":1},{"name":"Shoot","sell":8},{"name":"Stem","sell":23},{"name":"Pointed Scale","sell":34},{"name":"Fluff","sell":4},{"name":"Ment","sell":250},{"name":"Romantic Flower","sell":10}]},{"id":1682,"name":"Remover","items":[{"name":"Empty Bottle","sell":3},{"name":"Used Iron Plate","sell":512},{"name":"Gas Mask","sell":10},{"name":"Yam","sell":90},{"name":"Detrimindexta","sell":200},{"name":"Karvodailnirol","sell":200},{"name":"Bucket Hat","sell":3000},{"name":"Remover Card","sell":10}]},{"id":1164,"name":"Requiem","items":[{"name":"Old Blue Box","sell":5000},{"name":"Emperium","sell":1},{"name":"Zargon","sell":240},{"name":"Horrendous Mouth","sell":195},{"name":"Memento","sell":300},{"name":"Mantle","sell":5000},{"name":"Level 6 Cookbook","sell":500},{"name":"Requiem Card","sell":10}]},{"id":2020,"name":"Rhyncho","items":[{"name":"Fluorescent Liquid","sell":356},{"name":"Karvodailnirol","sell":200},{"name":"Spiritual Crystal","sell":525}]},{"id":1815,"name":"Rice Cake","items":[{"name":"Small Rice Cake Dough","sell":0}]},{"id":1195,"name":"Rideword","items":[{"name":"Worn Out Page","sell":474},{"name":"Book of Billows","sell":17500},{"name":"Book of Mother Earth","sell":17500},{"name":"Book of the Blazing Sun","sell":17500},{"name":"Book of Gust of Wind","sell":17500},{"name":"Bookclip in Memory","sell":1500},{"name":"Old Magicbook","sell":1},{"name":"Rideword Card","sell":10}]},{"id":1052,"name":"Rocker","items":[{"name":"Grasshopper's Leg","sell":18},{"name":"Green Acre Guitar","sell":10},{"name":"Green Feeler","sell":10},{"name":"Javelin","sell":75},{"name":"Hinalle Leaflet","sell":75},{"name":"Rocker Doll","sell":2000},{"name":"Hinalle","sell":250},{"name":"Rocker Card","sell":10}]},{"id":1012,"name":"Roda Frog","items":[{"name":"Sticky Webfoot","sell":10},{"name":"Spawn","sell":70},{"name":"Green Herb","sell":5},{"name":"Emerald","sell":3000},{"name":"Empty Bottle","sell":3},{"name":"Roda Frog Card","sell":10}]},{"id":1392,"name":"Rotar Zairo","items":[{"name":"Large Jellopy","sell":420},{"name":"Padded Armor","sell":24000},{"name":"Cyfar","sell":386},{"name":"Steel","sell":500},{"name":"Oridecon","sell":550},{"name":"Zargon","sell":240},{"name":"Garlet","sell":20},{"name":"Rotar Zairo Card","sell":10}]},{"id":1782,"name":"Roween","items":[{"name":"Rotten Meat","sell":51},{"name":"Animal Skin","sell":18},{"name":"Wind of Verdure","sell":500},{"name":"Combo Battle Glove","sell":10},{"name":"Roween Card","sell":10}]},{"id":1623,"name":"RSX-0806","items":[{"name":"Cogwheel","sell":756},{"name":"Ice Pick","sell":10},{"name":"Old Purple Box","sell":5000},{"name":"Flashlight","sell":512},{"name":"Dagger of Counter","sell":60000},{"name":"Wrench","sell":10},{"name":"RSX-0806 Card","sell":10},{"name":"Yggdrasil Berry","sell":2500},{"name":"Dark Blinder","sell":10},{"name":"3carat Diamond","sell":27500}]},{"id":2026,"name":"Runaway Dandelion Member","items":[{"name":"Old Frying Pan","sell":98},{"name":"Fresh Fish","sell":125},{"name":"Spoon Stub","sell":1250},{"name":"Edible Mushroom","sell":20},{"name":"Outdoor Cooking Kit","sell":250},{"name":"Green Herb","sell":5},{"name":"Piece of Egg Shell","sell":84},{"name":"Tree Root","sell":6}]},{"id":1201,"name":"Rybio","items":[{"name":"Tongue","sell":264},{"name":"Executioner's Mitten","sell":2250},{"name":"White Herb","sell":60},{"name":"2carat Diamond","sell":12500},{"name":"Necklace of Oblivion","sell":1},{"name":"Oridecon","sell":550},{"name":"Izidor","sell":250},{"name":"Rybio Card","sell":10}]},{"id":1281,"name":"Sage Worm","items":[{"name":"Librarian Glove","sell":10},{"name":"Worn Out Page","sell":474},{"name":"Earthworm Peeling","sell":98},{"name":"Level 5 Fire Bolt","sell":1000},{"name":"Blue Potion","sell":2500},{"name":"Level 5 Cold Bolt","sell":1000},{"name":"Ph.D Hat","sell":10},{"name":"Sage Worm Card","sell":10}]},{"id":1831,"name":"Salamander","items":[{"name":"Burning Heart","sell":462},{"name":"Flame Heart","sell":1500},{"name":"Red Gemstone","sell":300},{"name":"Lesser Elemental Ring","sell":10},{"name":"Berserk Guitar","sell":10},{"name":"Ring","sell":15000},{"name":"Meteo Plate Armor","sell":10},{"name":"Salamander Card","sell":10}]},{"id":1492,"name":"Samurai Specter","items":[{"name":"Masamune","sell":10},{"name":"Elunium","sell":550},{"name":"Assassin Mask","sell":10},{"name":"Yggdrasil Berry","sell":2500},{"name":"Steel","sell":500},{"name":"Huuma Blaze Shuriken","sell":39000},{"name":"Azoth","sell":10},{"name":"Samurai Spector Card","sell":10},{"name":"Yggdrasil Seed","sell":2500}]},{"id":1165,"name":"Sandman","items":[{"name":"Great Nature","sell":1500},{"name":"Grit","sell":153},{"name":"Rough Elunium","sell":325},{"name":"Fine Sand","sell":50},{"name":"Star Dust","sell":750},{"name":"Katar of Quaking","sell":22500},{"name":"Hypnotist's Staff","sell":10},{"name":"Sandman Card","sell":10}]},{"id":1062,"name":"Santa Poring","items":[{"name":"Candy","sell":5},{"name":"Candy Cane","sell":10},{"name":"Red Herb","sell":9},{"name":"Apple","sell":7},{"name":"Santa Hat","sell":10},{"name":"Santa Poring Card","sell":10}]},{"id":1243,"name":"Sasquatch","items":[{"name":"Zargon","sell":240},{"name":"White Herb","sell":60},{"name":"Feather","sell":10},{"name":"Panda Hat","sell":10},{"name":"Bear's Footskin","sell":87},{"name":"Opal","sell":3000},{"name":"Rough Elunium","sell":325},{"name":"Sasquatch Card","sell":10},{"name":"Wooden Block","sell":10}]},{"id":1166,"name":"Savage","items":[{"name":"Mane","sell":98},{"name":"Grape","sell":100},{"name":"Animal Gore","sell":225},{"name":"Angled Glasses","sell":10},{"name":"Anodyne","sell":1000},{"name":"Rough Elunium","sell":325},{"name":"Royal Jelly","sell":3500},{"name":"Savage Card","sell":10}]},{"id":1167,"name":"Savage Babe","items":[{"name":"Animal Skin","sell":18},{"name":"Axe","sell":250},{"name":"Meat","sell":25},{"name":"Arrow","sell":0},{"name":"Feather","sell":10},{"name":"Phracon","sell":100},{"name":"Sweet Milk","sell":3500},{"name":"Savage Babe Card","sell":10}]},{"id":1001,"name":"Scorpion","items":[{"name":"Red Blood","sell":500},{"name":"Scorpion Tail","sell":62},{"name":"Rough Elunium","sell":325},{"name":"Solid Shell","sell":224},{"name":"Fine Grit","sell":60},{"name":"Yellow Herb","sell":20},{"name":"Rusty Iron","sell":50},{"name":"Scorpion Card","sell":10}]},{"id":1323,"name":"Sea Otter","items":[{"name":"Pearl","sell":3000},{"name":"Clam Shell","sell":28},{"name":"Sea-Otter Fur","sell":410},{"name":"Sardonyx","sell":3000},{"name":"Sapphire","sell":3000},{"name":"Glass Bead","sell":700},{"name":"Cyfar","sell":386},{"name":"Sea-Otter Card","sell":10}]},{"id":1317,"name":"Seal","items":[{"name":"Zargon","sell":240},{"name":"Blue Herb","sell":30},{"name":"Coat","sell":11000},{"name":"Cyfar","sell":386},{"name":"Guisarme","sell":6500},{"name":"Panacea","sell":250},{"name":"Glass Bead","sell":700},{"name":"Seal Card","sell":10}]},{"id":1774,"name":"Seeker","items":[{"name":"Red Prickly Fruit","sell":440},{"name":"Will of the Darkness","sell":367},{"name":"Elunium","sell":550},{"name":"Witched Starsand","sell":242},{"name":"Bloody Rune","sell":1008},{"name":"Berdysz","sell":10},{"name":"Seeker Card","sell":10}]},{"id":1634,"name":"Seyren Windsor","items":[{"name":"Handcuffs","sell":362},{"name":"Dragon Killer","sell":10},{"name":"Claymore","sell":37000},{"name":"Old Blue Box","sell":5000},{"name":"Helm","sell":22000},{"name":"Full Plate","sell":40000},{"name":"Ruber","sell":10},{"name":"Seyren Windsor Card","sell":10}]},{"id":1074,"name":"Shellfish","items":[{"name":"Clam Shell","sell":28},{"name":"Clam Flesh","sell":79},{"name":"Stone","sell":0},{"name":"Grit","sell":153},{"name":"Star Dust","sell":750},{"name":"Rough Elunium","sell":325},{"name":"Shell Fish Card","sell":10}]},{"id":1083,"name":"Shining Plant","items":[{"name":"Blue Herb","sell":30},{"name":"Yellow Herb","sell":20},{"name":"White Herb","sell":60},{"name":"Illusion Flower","sell":500},{"name":"Yggdrasil Seed","sell":2500},{"name":"Honey","sell":250},{"name":"Yggdrasil Berry","sell":2500},{"name":"Emperium","sell":1},{"name":"Love Flower","sell":10},{"name":"Pointed Scale","sell":34},{"name":"Green Herb","sell":5},{"name":"Red Herb","sell":9},{"name":"Fluff","sell":4}]},{"id":1401,"name":"Shinobi","items":[{"name":"Broken Shuriken","sell":235},{"name":"Ninja Suit","sell":10},{"name":"Cyfar","sell":386},{"name":"Shinobi Sash","sell":10000},{"name":"Thief Clothes","sell":37000},{"name":"Dark Mask","sell":157},{"name":"Murasame","sell":10},{"name":"Shinobi Card","sell":10}]},{"id":1037,"name":"Side Winder","items":[{"name":"Shining Scale","sell":233},{"name":"Zargon","sell":240},{"name":"Rough Oridecon","sell":275},{"name":"Tsurugi","sell":25500},{"name":"Venom Canine","sell":74},{"name":"Snake Scale","sell":41},{"name":"White Herb","sell":60},{"name":"Sidewinder Card","sell":10}]},{"id":2042,"name":"Silver Sniper","items":[{"name":"Steel","sell":500}]},{"id":1776,"name":"Siroma","items":[{"name":"Glacial Heart","sell":303},{"name":"Ice Cubic","sell":330},{"name":"Blue Herb","sell":30},{"name":"Crystal Blue","sell":500},{"name":"Siroma Card","sell":10}]},{"id":1754,"name":"Skeggiold","items":[{"name":"Rune of Darkness","sell":1263},{"name":"Angel Wing","sell":10},{"name":"Soft Feather","sell":140},{"name":"Divine Cross","sell":10},{"name":"Silk Robe","sell":4000},{"name":"Odin's Blessing","sell":15000},{"name":"Skeggiold Card","sell":10}]},{"id":1076,"name":"Skeleton","items":[{"name":"Phracon","sell":100},{"name":"Skel-Bone","sell":116},{"name":"Mace","sell":800},{"name":"Jellopy","sell":3},{"name":"Red Herb","sell":9},{"name":"Skull Ring","sell":5000},{"name":"Skeleton Card","sell":10}]},{"id":1290,"name":"Skeleton General","items":[{"name":"Burnt Tree","sell":361},{"name":"Rough Oridecon","sell":275},{"name":"Yellow Herb","sell":20},{"name":"Gladius","sell":21500},{"name":"Sandstorm","sell":10},{"name":"Ghost Bandana","sell":10},{"name":"Skeleton General Card","sell":10}]},{"id":1196,"name":"Skeleton Prisoner","items":[{"name":"Manacles","sell":329},{"name":"Spoon Stub","sell":1250},{"name":"Formal Suit","sell":10},{"name":"Red Gemstone","sell":300},{"name":"Rotten Bandage","sell":175},{"name":"Shackles","sell":2500},{"name":"Memento","sell":300},{"name":"Skeleton Prisoner Card","sell":10}]},{"id":1169,"name":"Skeleton Worker","items":[{"name":"Iron","sell":50},{"name":"Lantern","sell":125},{"name":"Rough Elunium","sell":325},{"name":"Safety Helmet","sell":10},{"name":"Steel","sell":500},{"name":"Coal","sell":250},{"name":"Iron Ore","sell":25},{"name":"Skeleton Worker Card","sell":10}]},{"id":1752,"name":"Skogul","items":[{"name":"Rune of Darkness","sell":1263},{"name":"Brigan","sell":373},{"name":"Red Gemstone","sell":300},{"name":"Rouge","sell":5000},{"name":"Skull Ring","sell":5000},{"name":"Rough Elunium","sell":325},{"name":"Blood Tears","sell":10},{"name":"Skogul Card","sell":10}]},{"id":1386,"name":"Sleeper","items":[{"name":"Sand Clump","sell":353},{"name":"Grit","sell":153},{"name":"Great Nature","sell":1500},{"name":"Rough Oridecon","sell":275},{"name":"Damascus","sell":24500},{"name":"Hypnotist's Staff","sell":10},{"name":"Fine Sand","sell":50},{"name":"Sleeper Card","sell":10}]},{"id":1056,"name":"Smokie","items":[{"name":"Raccoon Leaf","sell":53},{"name":"Animal Skin","sell":18},{"name":"Potato","sell":7},{"name":"Kitty Band","sell":10},{"name":"Raccoon Doll","sell":2500},{"name":"Zargon","sell":240},{"name":"Zircon","sell":3000},{"name":"Smokie Card","sell":10}]},{"id":1235,"name":"Smoking Orc","items":[{"name":"Iron","sell":50},{"name":"Orcish Voucher","sell":71},{"name":"Rough Oridecon","sell":275},{"name":"Cigarette","sell":10},{"name":"Battle Axe","sell":2700},{"name":"Orcish Axe","sell":10},{"name":"Axe","sell":250},{"name":"Orc Warrior Card","sell":10}]},{"id":1841,"name":"Snake Lord's Minion","items":[{"name":"Gold Coin","sell":50},{"name":"Green Ale","sell":2500},{"name":"Treasure Box","sell":50}]},{"id":1644,"name":"Sniper Cecil","items":[{"name":"Old Purple Box","sell":5000},{"name":"Combat Knife","sell":10},{"name":"Sucsamad","sell":10},{"name":"Moonlight Dagger","sell":10},{"name":"Grimtooth","sell":10},{"name":"Rudra Bow","sell":10},{"name":"Dragon Wing","sell":10},{"name":"Sniper Card","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"Luna Bow","sell":10},{"name":"Evil Mind","sell":5}]},{"id":1775,"name":"Snowier","items":[{"name":"Glacial Heart","sell":303},{"name":"Ice Cubic","sell":330},{"name":"Rough Elunium","sell":325},{"name":"Blue Herb","sell":30},{"name":"White Herb","sell":60},{"name":"Icicle Fist","sell":10},{"name":"Crystal Blue","sell":500},{"name":"Snowier Card","sell":10}]},{"id":1170,"name":"Sohee","items":[{"name":"Black Hair","sell":146},{"name":"Skirt of Virgin","sell":850},{"name":"Nurse Cap","sell":10},{"name":"Muffler","sell":2500},{"name":"Stiletto","sell":9750},{"name":"Red Herb","sell":9},{"name":"Authoritative Badge","sell":725},{"name":"Sohee Card","sell":10}]},{"id":1028,"name":"Soldier Skeleton","items":[{"name":"Skel-Bone","sell":116},{"name":"Rough Oridecon","sell":275},{"name":"Dagger","sell":7000},{"name":"Red Herb","sell":9},{"name":"Memento","sell":300},{"name":"Knife","sell":25},{"name":"Stiletto","sell":9750},{"name":"Soldier Skeleton Card","sell":10}]},{"id":1316,"name":"Solider","items":[{"name":"Turtle Shell","sell":340},{"name":"Broken Shell","sell":450},{"name":"Stone Fragment","sell":320},{"name":"Yellow Herb","sell":20},{"name":"Zargon","sell":240},{"name":"Honey","sell":250},{"name":"Chain","sell":11500},{"name":"Solider Card","sell":10}]},{"id":1014,"name":"Spore","items":[{"name":"Mushroom Spore","sell":18},{"name":"Red Herb","sell":9},{"name":"Blue Herb","sell":30},{"name":"Spore Doll","sell":2750},{"name":"Hat","sell":500},{"name":"Poison Spore","sell":57},{"name":"Strawberry","sell":100},{"name":"Spore Card","sell":10}]},{"id":1322,"name":"Spring Rabbit","items":[{"name":"Brigan","sell":373},{"name":"Cyfar","sell":386},{"name":"Feather","sell":10},{"name":"Green Herb","sell":5},{"name":"Yellow Herb","sell":20},{"name":"Blue Herb","sell":30},{"name":"White Herb","sell":60},{"name":"Spring Rabbit Card","sell":10},{"name":"Hometown Gift","sell":10},{"name":"Lucky Cookie","sell":0},{"name":"Bag of Nuts","sell":0},{"name":"Peeps","sell":0},{"name":"Jelly Bean","sell":0},{"name":"Marshmallow","sell":0}]},{"id":1174,"name":"Stainer","items":[{"name":"Wind of Verdure","sell":500},{"name":"Emveretarcon","sell":500},{"name":"Rainbow Shell","sell":45},{"name":"Garlet","sell":20},{"name":"Rough Elunium","sell":325},{"name":"Solid Shell","sell":224},{"name":"Iron Ore","sell":25},{"name":"Stainer Card","sell":10}]},{"id":1278,"name":"Stalactic Golem","items":[{"name":"Mud Lump","sell":438},{"name":"Brigan","sell":373},{"name":"Star Crumb","sell":2250},{"name":"Great Nature","sell":1500},{"name":"Rough Elunium","sell":325},{"name":"Elunium","sell":550},{"name":"Stalactic Golem Card","sell":10}]},{"id":1784,"name":"Stapo","items":[{"name":"Jellopy","sell":3},{"name":"Jubilee","sell":16},{"name":"Apple","sell":7},{"name":"Large Jellopy","sell":420},{"name":"Green Live","sell":500},{"name":"Seismic Fist","sell":10},{"name":"Stapo Card","sell":10}]},{"id":1042,"name":"Steel Chonchon","items":[{"name":"Wind of Verdure","sell":500},{"name":"Steel","sell":500},{"name":"Garlet","sell":20},{"name":"Shell","sell":7},{"name":"Solid Shell","sell":224},{"name":"Iron","sell":50},{"name":"Iron Ore","sell":25},{"name":"Steel Chonchon Card","sell":10}]},{"id":1215,"name":"Stem Worm","items":[{"name":"Tough Scalelike Stem","sell":206},{"name":"White Herb","sell":60},{"name":"Skipping Rope","sell":10},{"name":"Rough Oridecon","sell":275},{"name":"Great Nature","sell":1500},{"name":"Glaive","sell":10000},{"name":"Yggdrasil Seed","sell":2500},{"name":"Stem Worm Card","sell":10}]},{"id":1207,"name":"Sting","items":[{"name":"Mud Lump","sell":438},{"name":"Stone Arrow","sell":1},{"name":"Glove","sell":15000},{"name":"Coal","sell":250},{"name":"Great Nature","sell":1500},{"name":"Silk Ribbon","sell":10},{"name":"Amethyst","sell":3000},{"name":"Sting Card","sell":10}]},{"id":1495,"name":"Stone Shooter","items":[{"name":"Strong Branch","sell":95},{"name":"Log","sell":125},{"name":"Brown Root","sell":280},{"name":"Trunk","sell":30},{"name":"Rough Oridecon","sell":275},{"name":"Stone","sell":0},{"name":"Stone Shooter Card","sell":10}]},{"id":1251,"name":"Stormy Knight","items":[{"name":"Zephyrus","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"Old Purple Box","sell":5000},{"name":"Ring","sell":15000},{"name":"Manteau","sell":16000},{"name":"Elunium","sell":550},{"name":"Grand Circlet","sell":10},{"name":"Stormy Knight Card","sell":10},{"name":"Aquamarine","sell":3000},{"name":"Boots","sell":9000},{"name":"Mystic Frozen","sell":1500}]},{"id":1065,"name":"Strouf","items":[{"name":"Fin","sell":206},{"name":"Rough Oridecon","sell":275},{"name":"Grampa Beard","sell":2500},{"name":"Trident","sell":25500},{"name":"Feather","sell":10},{"name":"Aquamarine","sell":3000},{"name":"Gill","sell":171},{"name":"Strouf Card","sell":10}]},{"id":1370,"name":"Succubus","items":[{"name":"Mastela Fruit","sell":4250},{"name":"Crystal Pumps","sell":10},{"name":"Boy's Pure Heart","sell":10},{"name":"Diamond Ring","sell":22500},{"name":"Succubus Horn","sell":10},{"name":"Soul Staff","sell":10},{"name":"Blue Potion","sell":2500},{"name":"Succubus Card","sell":10}]},{"id":1829,"name":"Sword Master","items":[{"name":"Destroyed Armor","sell":521},{"name":"Doom Slayer","sell":10},{"name":"Claymore","sell":37000},{"name":"Zweihander","sell":10},{"name":"Platinum Shield","sell":10},{"name":"Muscle Cutter","sell":10},{"name":"Sword Guardian Card","sell":10}]},{"id":1069,"name":"Swordfish","items":[{"name":"Mystic Frozen","sell":1500},{"name":"Sharp Scale","sell":125},{"name":"Rough Oridecon","sell":275},{"name":"Unicorn Horn","sell":10},{"name":"Rough Elunium","sell":325},{"name":"Katana","sell":1000},{"name":"Gill","sell":171},{"name":"Swordfish Card","sell":10}]},{"id":1584,"name":"Tamruan","items":[{"name":"Tassel","sell":399},{"name":"Destroyed Armor","sell":521},{"name":"Katana","sell":1000},{"name":"Bastard Sword","sell":11250},{"name":"Chain Mail","sell":32500},{"name":"Tamruan Card","sell":10}]},{"id":1583,"name":"Tao Gunka","items":[{"name":"Gemstone","sell":710},{"name":"Stone Fragment","sell":320},{"name":"Topaz","sell":3000},{"name":"Binoculars","sell":10},{"name":"White Potion","sell":600},{"name":"Iron Ore","sell":25},{"name":"Gemmed Sallet","sell":25000},{"name":"Tao Gunka Card","sell":10},{"name":"Oridecon","sell":550},{"name":"Old Purple Box","sell":5000},{"name":"Blue Potion","sell":2500}]},{"id":1412,"name":"Taoist Hermit","items":[{"name":"Cloud Crumb","sell":195},{"name":"Cheese","sell":1400},{"name":"Rice Cake","sell":5},{"name":"Bao","sell":0},{"name":"Guitar","sell":23500},{"name":"Rough Elunium","sell":325},{"name":"Level 5 Lightening Bolt","sell":1000},{"name":"Cloud Hermit Card","sell":10}]},{"id":1175,"name":"Tarou","items":[{"name":"Rat Tail","sell":26},{"name":"Animal Skin","sell":18},{"name":"Feather","sell":10},{"name":"Monster's Feed","sell":30},{"name":"Ora Ora","sell":27500},{"name":"Tarou Card","sell":10}]},{"id":1986,"name":"Tatacho","items":[{"name":"Lunakaligo","sell":10},{"name":"Cello","sell":10},{"name":"Fur","sell":352},{"name":"Peaked Hat","sell":216},{"name":"Fresh Fish","sell":125},{"name":"Potato","sell":7},{"name":"Tatacho Card","sell":10}]},{"id":1622,"name":"Teddy Bear","items":[{"name":"Rusty Screw","sell":267},{"name":"Honey","sell":250},{"name":"Oridecon Hammer","sell":2500},{"name":"Gold Lux","sell":50000},{"name":"Angry Snarl","sell":10},{"name":"Goddess of Fortune's Cursed Brooch","sell":10},{"name":"Elunium","sell":550},{"name":"Teddy Bear Card","sell":10}]},{"id":1991,"name":"Tendrilion","items":[{"name":"Leather of Tendrilion","sell":10},{"name":"Death Guidance","sell":10},{"name":"Eraser","sell":10},{"name":"Horn of Tendrilion","sell":250},{"name":"Fur","sell":352},{"name":"Tough Vines","sell":250},{"name":"Stiff Horn","sell":318}]},{"id":1405,"name":"Tengu","items":[{"name":"Tengu Nose","sell":200},{"name":"Broken Liquor Jar","sell":80},{"name":"Huuma Giant Wheel Shuriken","sell":20000},{"name":"Mastela Fruit","sell":4250},{"name":"Royal Cooking Kit","sell":2500},{"name":"Level 5 Earth Spike","sell":1000},{"name":"Tengu Card","sell":10}]},{"id":1034,"name":"Thara Frog","items":[{"name":"Emveretarcon","sell":500},{"name":"Spawn","sell":70},{"name":"Scell","sell":80},{"name":"White Herb","sell":60},{"name":"Sardonyx","sell":3000},{"name":"Sticky Webfoot","sell":10},{"name":"Thara Frog Card","sell":10}]},{"id":1375,"name":"The Paper","items":[{"name":"Slick Paper","sell":353},{"name":"Sharp Paper","sell":453},{"name":"Yellow Herb","sell":20},{"name":"Green Herb","sell":5},{"name":"Kamaitachi","sell":24000},{"name":"The Paper Card","sell":10}]},{"id":1051,"name":"Thief Bug","items":[{"name":"Worm Peeling","sell":26},{"name":"Jacket","sell":100},{"name":"Red Herb","sell":9},{"name":"Jellopy","sell":3},{"name":"Iron Ore","sell":25},{"name":"Thief Bug Card","sell":10}]},{"id":1048,"name":"Thief Bug Egg","items":[{"name":"Phracon","sell":100},{"name":"Chrysalis","sell":4},{"name":"Guard","sell":250},{"name":"Sticky Mucus","sell":35},{"name":"Red Gemstone","sell":300},{"name":"Black Ladle","sell":200},{"name":"Iron Ore","sell":25},{"name":"Thief Bug Egg Card","sell":10}]},{"id":1053,"name":"Thief Bug Female","items":[{"name":"Worm Peeling","sell":26},{"name":"Garlet","sell":20},{"name":"Blade","sell":1450},{"name":"Insect Feeler","sell":57},{"name":"Red Herb","sell":9},{"name":"Red Gemstone","sell":300},{"name":"Iron Ore","sell":25},{"name":"Female Thief Bug Card","sell":10}]},{"id":1054,"name":"Thief Bug Male","items":[{"name":"Emveretarcon","sell":500},{"name":"Insect Feeler","sell":57},{"name":"Worm Peeling","sell":26},{"name":"Slayer","sell":7500},{"name":"Yellow Herb","sell":20},{"name":"Zircon","sell":3000},{"name":"Katana","sell":1000},{"name":"Male Thief Bug Card","sell":10}]},{"id":1182,"name":"Thief Mushroom","items":[{"name":"Orange Net Mushroom","sell":1},{"name":"Orange Gooey Mushroom","sell":1}]},{"id":1089,"name":"Toad","items":[{"name":"Big Ribbon","sell":7500},{"name":"Honey","sell":250},{"name":"Zircon","sell":3000},{"name":"Glass Bead","sell":700},{"name":"Alcohol","sell":200},{"name":"Detrimindexta","sell":200},{"name":"Angel's Kiss","sell":5000},{"name":"Toad Card","sell":10}]},{"id":2073,"name":"Toucan","items":[{"name":"Talon","sell":10},{"name":"Cyfar","sell":386},{"name":"Blue Herb","sell":30},{"name":"Yellow Herb","sell":20},{"name":"Flower Ring","sell":750}]},{"id":1845,"name":"Treasure Box","items":[{"name":"Gold Coin","sell":50},{"name":"Treasure Box","sell":50},{"name":"Green Ale","sell":2500},{"name":"Episode 13.1 Poporing Key","sell":0},{"name":"Episode 13.2 Poring Key","sell":0}]},{"id":1324,"name":"Treasure Chest","items":[{"name":"3carat Diamond","sell":27500},{"name":"Yggdrasil Seed","sell":2500},{"name":"Yggdrasil Berry","sell":2500},{"name":"Muffler","sell":2500},{"name":"Shoes","sell":1750},{"name":"Chain Mail","sell":32500},{"name":"Buckler","sell":7000},{"name":"Old Card Album","sell":5000},{"name":"Freya's Jewel","sell":0},{"name":"Union of Tribe","sell":1},{"name":"Dead Branch","sell":25},{"name":"Oridecon","sell":550},{"name":"Elunium","sell":550},{"name":"Poison Knife","sell":10},{"name":"Mage Hat","sell":10},{"name":"Masamune","sell":10},{"name":"Thor's Gauntlets","sell":0},{"name":"Mirror Shield","sell":30000},{"name":"War Axe","sell":10},{"name":"Hat of the Sun God","sell":10},{"name":"Iron Maiden","sell":0},{"name":"Guard","sell":250},{"name":"Corsair","sell":10},{"name":"Jewel Crown","sell":10},{"name":"Wheel of the Unknown","sell":0},{"name":"Critical Ring","sell":37500},{"name":"Mage Coat","sell":10},{"name":"Earring","sell":15000},{"name":"Silver Ornament","sell":0},{"name":"Tights","sell":35500},{"name":"Necklace","sell":15000},{"name":"Wrath of Valkyrie","sell":0},{"name":"Romantic Leaf","sell":10},{"name":"Gakkung Bow","sell":21000},{"name":"Majestic Goat","sell":10},{"name":"Feather of Angel Wing","sell":0},{"name":"Zeny Knife","sell":10},{"name":"Wrench","sell":10},{"name":"Lord's Clothes","sell":10},{"name":"Cat Tread","sell":0},{"name":"Rosary","sell":7500},{"name":"Soul Staff","sell":10},{"name":"Holy Robe","sell":10},{"name":"Woman's Moustache","sell":0},{"name":"Gaia Sword","sell":10},{"name":"Grimtooth","sell":10},{"name":"Crown","sell":10},{"name":"Root of Stone","sell":0},{"name":"Old Purple Box","sell":5000},{"name":"Sashimi","sell":10},{"name":"Grand Circlet","sell":10},{"name":"Spirit of Fish","sell":0},{"name":"Ragamuffin Manteau","sell":28000},{"name":"Thief Clothes","sell":37000},{"name":"Ring","sell":15000},{"name":"Sputum of Bird","sell":0},{"name":"Shield","sell":28000},{"name":"Muramasa","sell":10},{"name":"Helm of Angel","sell":10},{"name":"Sinew of Bear","sell":0},{"name":"Gemmed Sallet","sell":25000},{"name":"Glove","sell":15000},{"name":"Elven Ears","sell":10},{"name":"Emblem of the Sun God","sell":0},{"name":"Ear Muffs","sell":10},{"name":"Safety Ring","sell":37500},{"name":"Tiara","sell":10},{"name":"Breath of Spirit","sell":0},{"name":"Ancient Cape","sell":41000},{"name":"Brooch","sell":15000},{"name":"Magician Hat","sell":10},{"name":"Snow Crystal","sell":0},{"name":"Crystal Pumps","sell":10},{"name":"Romantic Flower","sell":10},{"name":"Full Plate","sell":40000},{"name":"Omen of Tempest","sell":0},{"name":"Memory Book","sell":10},{"name":"Boots","sell":9000},{"name":"Spiky Band","sell":10},{"name":"Ripple","sell":0},{"name":"Jeweled Sword","sell":10},{"name":"Evil Wing","sell":10},{"name":"Bone Helm","sell":10},{"name":"Billow","sell":0},{"name":"Pole Axe","sell":10},{"name":"Sphinx Hat","sell":10},{"name":"Helm","sell":22000},{"name":"Drifting Air","sell":0},{"name":"Manteau","sell":16000},{"name":"Angel Wing","sell":10},{"name":"Iron Driver","sell":10},{"name":"Wind General","sell":0},{"name":"Jewel of Destruction","sell":5},{"name":"Goddess Tear","sell":0},{"name":"Dead Branch Box","sell":10},{"name":"Pauldron","sell":10},{"name":"Healing Staff","sell":10},{"name":"Wild Beast Claw","sell":10},{"name":"Valkyrie's Token","sell":0},{"name":"Heavenly Maiden Robe","sell":10},{"name":"Berdysz","sell":10},{"name":"Inverse Scale","sell":10},{"name":"Brynhild Armor Piece","sell":0},{"name":"Scalpel","sell":10},{"name":"Heart Breaker","sell":10},{"name":"Blood Tears","sell":10},{"name":"Hero's Remains","sell":0},{"name":"Platinum Shotel","sell":10},{"name":"Burning Bow","sell":10},{"name":"Divine Cross","sell":10},{"name":"Andvari's Ring","sell":0},{"name":"Muscle Cutter","sell":10},{"name":"Orc Archer Bow","sell":10},{"name":"Icicle Fist","sell":10},{"name":"Dusk Glow","sell":0},{"name":"Battle Hook","sell":10},{"name":"Frozen Bow","sell":10},{"name":"Combo Battle Glove","sell":10},{"name":"Dawn Essence","sell":0},{"name":"Ahlspiess","sell":10},{"name":"Earth Bow","sell":10},{"name":"Ulfhedinn","sell":10},{"name":"Cold Moonlight","sell":0},{"name":"Lich's Bone Wand","sell":10},{"name":"Gust Bow","sell":10},{"name":"Seismic Fist","sell":10},{"name":"Hazy Starlight","sell":0},{"name":"Piercing Staff","sell":10},{"name":"Drill Katar","sell":10},{"name":"Mithril Magic Cape","sell":10},{"name":"Event Treasure Box","sell":10},{"name":"Soul Crystal","sell":0}]},{"id":1279,"name":"Tri Joint","items":[{"name":"Cyfar","sell":386},{"name":"Solid Shell","sell":224},{"name":"Aloevera","sell":750},{"name":"Green Live","sell":500},{"name":"Star Dust","sell":750},{"name":"Rough Elunium","sell":325},{"name":"Tri Joint Card","sell":10}]},{"id":1312,"name":"Turtle General","items":[{"name":"Iron Driver","sell":10},{"name":"War Axe","sell":10},{"name":"Level 9 Cookbook","sell":500},{"name":"Pole Axe","sell":10},{"name":"Broken Shell","sell":450},{"name":"Immaterial Sword","sell":10},{"name":"Union of Tribe","sell":1},{"name":"Turtle General Card","sell":10},{"name":"Turtle Shell","sell":340},{"name":"Yggdrasil Berry","sell":2500},{"name":"Old Purple Box","sell":5000}]},{"id":1618,"name":"Ungoliant","items":[{"name":"Insect Leg","sell":329},{"name":"Ant Jaw","sell":116},{"name":"Rainbow Shell","sell":45},{"name":"Peridot","sell":1500},{"name":"Fluorescent Liquid","sell":356},{"name":"Garnet","sell":3000},{"name":"Boots","sell":9000},{"name":"Ungoliant Card","sell":10}]},{"id":1883,"name":"Uzhas","items":[{"name":"Hinalle Leaflet","sell":75},{"name":"Ancient Magic","sell":10},{"name":"Bitter Herb","sell":10},{"name":"Mastela Fruit","sell":4250},{"name":"Sticky Webfoot","sell":10},{"name":"Fresh Fish","sell":125},{"name":"Old Blue Box","sell":5000}]},{"id":1066,"name":"Vadon","items":[{"name":"Crystal Blue","sell":500},{"name":"Nipper","sell":57},{"name":"Garlet","sell":20},{"name":"Padded Armor","sell":24000},{"name":"Solid Shell","sell":224},{"name":"Rough Elunium","sell":325},{"name":"Blue Gemstone","sell":300},{"name":"Vadon Card","sell":10}]},{"id":1092,"name":"Vagabond Wolf","items":[{"name":"Western Grace","sell":7500},{"name":"Wolf Claw","sell":29},{"name":"Topaz","sell":3000},{"name":"Star Dust Blade","sell":10},{"name":"Angelic Cardigan","sell":5000},{"name":"Sardonyx","sell":3000},{"name":"Monster Juice","sell":750},{"name":"Vagabond Wolf Card","sell":10}]},{"id":1765,"name":"Valkyrie","items":[{"name":"Valhalla's Flower","sell":100000},{"name":"Old Purple Box","sell":5000},{"name":"Valkyrja's Shield","sell":15000}]},{"id":1751,"name":"Valkyrie Randgris","items":[{"name":"Valhalla's Flower","sell":100000},{"name":"Valkyrian Armor","sell":0},{"name":"Valkyrian Manteau","sell":0},{"name":"Valkyrian Shoes","sell":0},{"name":"Helm","sell":22000},{"name":"Bloody Edge","sell":5000},{"name":"Randgris Card","sell":10},{"name":"Old Purple Box","sell":5000},{"name":"Old Blue Box","sell":5000},{"name":"Old Card Album","sell":5000}]},{"id":1771,"name":"Vanberk","items":[{"name":"White Mask","sell":530},{"name":"Royal Jelly","sell":3500},{"name":"Bloody Rune","sell":1008},{"name":"Beret","sell":15000},{"name":"Scalpel","sell":10},{"name":"Vanberk Card","sell":10}]},{"id":1675,"name":"Venatu","items":[{"name":"Venatu Card","sell":10},{"name":"Rusty Screw","sell":267},{"name":"Crest Piece","sell":2500},{"name":"Steel","sell":500},{"name":"Fragment","sell":672},{"name":"Drifter","sell":40000},{"name":"Elunium","sell":550},{"name":"Professional Cooking Kit","sell":1000},{"name":"Long Barrel","sell":20000},{"name":"Armor Charm","sell":10000}]},{"id":1621,"name":"Venomous","items":[{"name":"Dust Pollutant","sell":128},{"name":"Bacillus","sell":512},{"name":"Poisonous Powder","sell":80},{"name":"Toxic Gas","sell":333},{"name":"Old Blue Box","sell":5000},{"name":"Venomous Card","sell":10}]},{"id":1032,"name":"Verit","items":[{"name":"Immortal Heart","sell":187},{"name":"Zargon","sell":240},{"name":"Rotten Bandage","sell":175},{"name":"White Herb","sell":60},{"name":"Skull Ring","sell":5000},{"name":"Flower Ring","sell":750},{"name":"Armlet of Obedience","sell":9000},{"name":"Verit Card","sell":10}]},{"id":1685,"name":"Vesper","items":[{"name":"Metal Fragment","sell":537},{"name":"Fragment","sell":672},{"name":"Old Purple Box","sell":5000},{"name":"Vesper Core 01","sell":10},{"name":"Vesper Core 02","sell":10},{"name":"Vesper Core 03","sell":10},{"name":"Vesper Core 04","sell":10},{"name":"Vesper Card","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"3carat Diamond","sell":27500}]},{"id":1390,"name":"Violy","items":[{"name":"Golden Hair","sell":215},{"name":"Professional Cooking Kit","sell":1000},{"name":"Puppet","sell":500},{"name":"Bass Guitar","sell":10},{"name":"Royal Jelly","sell":3500},{"name":"Cursed Water","sell":1},{"name":"Violin","sell":2000},{"name":"Violy Card","sell":10}]},{"id":1176,"name":"Vitata","items":[{"name":"Green Live","sell":500},{"name":"Worm Peeling","sell":26},{"name":"Scell","sell":80},{"name":"Honey","sell":250},{"name":"Royal Jelly","sell":3500},{"name":"Rough Oridecon","sell":275},{"name":"Vitata Card","sell":10}]},{"id":1088,"name":"Vocal","items":[{"name":"Romantic Gent","sell":7500},{"name":"Grasshopper's Leg","sell":18},{"name":"Emerald","sell":3000},{"name":"Rocker Doll","sell":2000},{"name":"Angel's Reincarnation","sell":5000},{"name":"Concentration Potion","sell":400},{"name":"Gentle Breeze Guitar","sell":10},{"name":"Vocal Card","sell":10}]},{"id":1208,"name":"Wanderer","items":[{"name":"Skull","sell":522},{"name":"Old Card Album","sell":5000},{"name":"Hakujin","sell":10},{"name":"Romantic Leaf","sell":10},{"name":"Yggdrasil Leaf","sell":2000},{"name":"Oridecon","sell":550},{"name":"Muramasa","sell":10},{"name":"Wanderer Card","sell":10}]},{"id":1398,"name":"Water Crystal","items":[{"name":"Piece of Cake","sell":1500},{"name":"Candy Cane","sell":10},{"name":"White Chocolate","sell":2500},{"name":"Gift Box","sell":500},{"name":"Holiday Hat","sell":0},{"name":"Grape Juice","sell":125},{"name":"Chocolate","sell":0},{"name":"Old Blue Box","sell":5000}]},{"id":1179,"name":"Whisper","items":[{"name":"Star Dust","sell":750},{"name":"Fabric","sell":153},{"name":"Halo","sell":10},{"name":"Silver Robe","sell":3500},{"name":"Whisper Card","sell":10}]},{"id":1518,"name":"White Lady","items":[{"name":"Black Hair","sell":146},{"name":"Old Blue Box","sell":5000},{"name":"Old Purple Box","sell":5000},{"name":"Transparent Celestial Robe","sell":325},{"name":"Soft Silk","sell":600},{"name":"Crystal Mirror","sell":7500},{"name":"Tiara","sell":10},{"name":"Tantan Noodle","sell":10},{"name":"Red Silk Seal","sell":10},{"name":"White Lady Card","sell":10},{"name":"Yggdrasil Berry","sell":2500},{"name":"Heavenly Maiden Robe","sell":10}]},{"id":1082,"name":"White Plant","items":[{"name":"White Herb","sell":60},{"name":"Flower","sell":1},{"name":"Deadly Noxious Herb","sell":10},{"name":"Stem","sell":23},{"name":"Pointed Scale","sell":34},{"name":"Aloe Leaflet","sell":180},{"name":"Hinalle","sell":250},{"name":"Romantic Flower","sell":10}]},{"id":1642,"name":"Whitesmith Howard","items":[{"name":"Old Purple Box","sell":5000},{"name":"Mysteltainn","sell":10},{"name":"Byeollungum","sell":10},{"name":"Lord's Clothes","sell":10},{"name":"Sabbath","sell":10},{"name":"Great Axe","sell":10},{"name":"Guillotine","sell":10},{"name":"Tomahawk","sell":10},{"name":"MasterSmith Card","sell":10},{"name":"Old Blue Box","sell":5000},{"name":"3carat Diamond","sell":27500}]},{"id":1653,"name":"Wickebine Tres","items":[{"name":"Handcuffs","sell":362},{"name":"Fortune Sword","sell":10},{"name":"Adventurer's Suit","sell":500},{"name":"Gladius","sell":21500},{"name":"Chain Mail","sell":32500},{"name":"Rogue's Treasure","sell":5000},{"name":"Cowardice Blade","sell":26000},{"name":"Wickebine Tres Card","sell":10},{"name":"Gift Box","sell":500}]},{"id":1261,"name":"Wild Rose","items":[{"name":"Cyfar","sell":386},{"name":"Witherless Rose","sell":27500},{"name":"Nut Shell","sell":10},{"name":"Arrow of Shadow","sell":1},{"name":"Rotten Fish","sell":1250},{"name":"Monster's Feed","sell":30},{"name":"Big Ribbon","sell":7500},{"name":"Wild Rose Card","sell":10}]},{"id":1010,"name":"Willow","items":[{"name":"Tree Root","sell":6},{"name":"Trunk","sell":30},{"name":"Resin","sell":60},{"name":"Potato","sell":7},{"name":"Barren Trunk","sell":1},{"name":"Solid Trunk","sell":1},{"name":"Fine-grained Trunk","sell":1},{"name":"Willow Card","sell":10}]},{"id":1395,"name":"Wind Crystal","items":[{"name":"Piece of Cake","sell":1500},{"name":"Candy Cane","sell":10},{"name":"White Chocolate","sell":2500},{"name":"Gift Box","sell":500},{"name":"Holiday Hat","sell":0},{"name":"Banana Juice","sell":10},{"name":"Chocolate","sell":0},{"name":"Yggdrasil Berry","sell":2500}]},{"id":1263,"name":"Wind Ghost","items":[{"name":"Zargon","sell":240},{"name":"Skel-Bone","sell":116},{"name":"Skull","sell":522},{"name":"Level 5 Lightening Bolt","sell":1000},{"name":"Arc Wand","sell":22500},{"name":"Rough Wind","sell":1500},{"name":"Evil Bone Wand","sell":10},{"name":"Wind Ghost Card","sell":10}]},{"id":1013,"name":"Wolf","items":[{"name":"Emveretarcon","sell":500},{"name":"Wolf Claw","sell":29},{"name":"Mantle","sell":5000},{"name":"Meat","sell":25},{"name":"Monster's Feed","sell":30},{"name":"Animal Skin","sell":18},{"name":"Strawberry","sell":100},{"name":"Wolf Card","sell":10}]},{"id":1880,"name":"Wood Goblin","items":[{"name":"Iron Wrist","sell":10},{"name":"Strong Branch","sell":95},{"name":"Log","sell":125},{"name":"Resin","sell":60},{"name":"Feather of Birds","sell":5},{"name":"Piece of Egg Shell","sell":84},{"name":"Egg","sell":10}]},{"id":1497,"name":"Wooden Golem","items":[{"name":"Wooden Heart","sell":340},{"name":"Brown Root","sell":280},{"name":"Rough Elunium","sell":325},{"name":"Romantic Leaf","sell":10},{"name":"Dead Branch","sell":25},{"name":"Log","sell":125},{"name":"Mushroom Spore","sell":18},{"name":"Wooden Golem Card","sell":10}]},{"id":2009,"name":"Woomawang","items":[{"name":"Devil's Cattle Ring","sell":0}]},{"id":1499,"name":"Wootan Fighter","items":[{"name":"Meat","sell":25},{"name":"Shoulder Protector","sell":115},{"name":"Waghnak","sell":4000},{"name":"Finger","sell":29000},{"name":"Banana","sell":7},{"name":"Huge Leaf","sell":305},{"name":"Banana Hat","sell":10},{"name":"Wootan Fighter Card","sell":10}]},{"id":1498,"name":"Wootan Shooter","items":[{"name":"Slingshot","sell":105},{"name":"Elastic Band","sell":190},{"name":"Banana","sell":7},{"name":"Stone","sell":0},{"name":"Apple","sell":7},{"name":"Cacao","sell":100},{"name":"Banana Hat","sell":10},{"name":"Wootan Shooter Card","sell":10}]},{"id":1024,"name":"Wormtail","items":[{"name":"Green Live","sell":500},{"name":"Emveretarcon","sell":500},{"name":"Pointed Scale","sell":34},{"name":"Pike","sell":1725},{"name":"Yellow Herb","sell":20},{"name":"Emerald","sell":3000},{"name":"Green Lace","sell":10},{"name":"Wormtail Card","sell":10}]},{"id":1917,"name":"Wounded Morocc","items":[{"name":"Dark Bacilium","sell":10},{"name":"Diabolus Robe","sell":10},{"name":"Diabolus Armor","sell":10},{"name":"Diabolus Boots","sell":10},{"name":"Crystal of Darkness","sell":5},{"name":"Fragment of Darkness","sell":250},{"name":"Yggdrasil Berry","sell":2500},{"name":"Old Purple Box","sell":5000}]},{"id":1192,"name":"Wraith","items":[{"name":"Fabric","sell":153},{"name":"Wedding Veil","sell":11500},{"name":"Manteau","sell":16000},{"name":"Red Gemstone","sell":300},{"name":"Butterfly Wing","sell":150},{"name":"2carat Diamond","sell":12500},{"name":"Wraith Card","sell":10}]},{"id":1291,"name":"Wraith Dead","items":[{"name":"Fabric","sell":153},{"name":"Wedding Veil","sell":11500},{"name":"Manteau","sell":16000},{"name":"Red Gemstone","sell":300},{"name":"3carat Diamond","sell":27500},{"name":"Old Blue Box","sell":5000},{"name":"Lemon","sell":30},{"name":"Wraith Dead Card","sell":10}]},{"id":1512,"name":"Yao Jun","items":[{"name":"Brigan","sell":373},{"name":"Amulet","sell":50},{"name":"Elunium","sell":550},{"name":"Boots","sell":9000},{"name":"Munak Doll","sell":4450},{"name":"Yao Jun Card","sell":10},{"name":"Orange Potion","sell":100},{"name":"Slow Potion","sell":1},{"name":"Speed Potion","sell":1}]},{"id":1081,"name":"Yellow Plant","items":[{"name":"Yellow Herb","sell":20},{"name":"Flower","sell":1},{"name":"Shoot","sell":8},{"name":"Stem","sell":23},{"name":"Pointed Scale","sell":34},{"name":"Singing Plant","sell":250},{"name":"Fluff","sell":4},{"name":"Romantic Flower","sell":10}]},{"id":1057,"name":"Yoyo","items":[{"name":"Yoyo Tail","sell":57},{"name":"Banana","sell":7},{"name":"Yellow Herb","sell":20},{"name":"Cacao","sell":100},{"name":"Yoyo Doll","sell":3000},{"name":"Rough Oridecon","sell":275},{"name":"Strawberry","sell":100},{"name":"Yoyo Card","sell":10},{"name":"Animal Skin","sell":18},{"name":"Orange","sell":150}]},{"id":1979,"name":"Zakudam","items":[{"name":"Rusty Screw","sell":267},{"name":"Steel","sell":500},{"name":"Oridecon","sell":550},{"name":"Elunium","sell":550},{"name":"Gate Keeper","sell":28000},{"name":"Gate Keeper-DD","sell":36000},{"name":"Improved Tights","sell":10}]},{"id":1200,"name":"Zealotus","items":[{"name":"Executioner's Mitten","sell":2250},{"name":"White Herb","sell":60},{"name":"Rose Quartz","sell":1500},{"name":"Tights","sell":35500},{"name":"Earring","sell":15000},{"name":"Queen's Whip","sell":10},{"name":"Masquerade","sell":10},{"name":"Zealotus Card","sell":10}]},{"id":1177,"name":"Zenorc","items":[{"name":"Zenorc's Fang","sell":132},{"name":"Rough Oridecon","sell":275},{"name":"Sticky Mucus","sell":35},{"name":"Old Magicbook","sell":1},{"name":"Yellow Herb","sell":20},{"name":"Shining Stone","sell":1500},{"name":"Zenorc Card","sell":10}]},{"id":1178,"name":"Zerom","items":[{"name":"Emveretarcon","sell":500},{"name":"Iron","sell":50},{"name":"Pantie","sell":500},{"name":"Gangster Mask","sell":10},{"name":"Shackles","sell":2500},{"name":"Iron Ore","sell":25},{"name":"Zerom Card","sell":10}]},{"id":1514,"name":"Zhu Po Long","items":[{"name":"Denture from Dragon Mask","sell":218},{"name":"Dragon Horn","sell":272},{"name":"Little Ghost Doll","sell":605},{"name":"Dragon Scale","sell":250},{"name":"Yarn","sell":50},{"name":"Zhu Po Long Card","sell":10},{"name":"Lucky Candy","sell":5},{"name":"Lucky Candy Cane","sell":10},{"name":"Lucky Cookie","sell":500},{"name":"Carrot","sell":7},{"name":"Firecracker","sell":1},{"name":"Red Envelope","sell":0}]},{"id":1417,"name":"Zipper Bear","items":[{"name":"Black Bear Skin","sell":192},{"name":"Strange Steel Piece","sell":215},{"name":"Royal Jelly","sell":3500},{"name":"Honey","sell":250},{"name":"Apple","sell":7},{"name":"Zipper Bear Card","sell":10}]},{"id":1015,"name":"Zombie","items":[{"name":"Decayed Nail","sell":41},{"name":"Cursed Ruby","sell":300},{"name":"Sticky Mucus","sell":35},{"name":"Horrendous Mouth","sell":195},{"name":"Opal","sell":3000},{"name":"Zombie Card","sell":10},{"name":"Jade Plate","sell":0}]},{"id":1298,"name":"Zombie Master","items":[{"name":"Tattered Clothes","sell":640},{"name":"Sticky Mucus","sell":35},{"name":"Horrendous Mouth","sell":195},{"name":"Ruby","sell":3000},{"name":"Opal","sell":3000},{"name":"Sharpened Legbone of Ghoul","sell":26250},{"name":"Scapulare","sell":3250},{"name":"Zombie Master Card","sell":10}]},{"id":1197,"name":"Zombie Prisoner","items":[{"name":"Worn-out Prison Uniform","sell":340},{"name":"Spoon Stub","sell":1250},{"name":"Iron Cain","sell":10},{"name":"Red Gemstone","sell":300},{"name":"Rotten Bandage","sell":175},{"name":"Shackles","sell":2500},{"name":"Elunium","sell":550},{"name":"Zombie Prisoner Card","sell":10}]},{"id":1864,"name":"Zombie Slaughter","items":[{"name":"Clattering Skull","sell":420},{"name":"Platinum Shotel","sell":10},{"name":"Memento","sell":300},{"name":"Broken Farming Utensil","sell":165},{"name":"Sticky Mucus","sell":35},{"name":"Zombie Slaughter Card","sell":10}]}];

const DEFAULT_MAPS = [
  {
    id: "geffen-dungeon-3",
    name: "Geffen Dungeon 3",
    items: [
      { name: "Blue Potion", sell: 3720 },
      { name: "Fire Wall", sell: 1240 },
      { name: "Silver Robe", sell: 4340 },
      { name: "Skull Ring", sell: 6200 },
      { name: "Partizan", sell: 16740 },
      { name: "Chain", sell: 80000 },
      { name: "Zargon", sell: 297 },
      { name: "Witherless Rose", sell: 9300 },
      { name: "Gift Box", sell: 8500 },
      { name: "Blue Herb", sell: 2700 },
      { name: "Poring Coin", sell: 13000 },
      { name: "Rough Wind", sell: 6800 },
      { name: "Solid Shell", sell: 277 },
      { name: "Horrendous Mouth", sell: 241 },
      { name: "Horseshoe", sell: 364 },
      { name: "Little Evil horn", sell: 327 },
      { name: "Little Evil Wing", sell: 1240 },
      { name: "Rough Oridicon", sell: 680 },
      { name: "Star Dust", sell: 930 },
      { name: "Fabric", sell: 1100 },
      { name: "Golden Hair", sell: 266 },
      { name: "Oridecon", sell: 3400 },
      { name: "Steel", sell: 1100 },
      { name: "Hand of God", sell: 50000 },
    ],
    extraItems: [],
  },
];

// Authoritative item metadata sourced from rAthena's public pre-renewal item
// database: https://github.com/rathena/rathena/tree/master/db/pre-re
// (item_db_usable.yml / item_db_equip.yml / item_db_etc.yml). Keyed by
// lowercase item name; value is [itemId, type, officialSell]. type is
// collapsed to "equip" | "use" | "misc". Equipment with multiple card-slot
// variants gets extra keyed entries like "chain[2]" / "chain[3]" alongside
// the base name, matching the slot counts in the source database.
const ITEM_METADATA = {"1carat diamond":[730,"misc",5000],"2carat diamond":[731,"misc",12500],"3carat diamond":[732,"misc",27500],"abysmal knight card":[4140,"misc",10],"acorn":[1026,"misc",49],"adventurer's suit":[2305,"equip",500],"adventurer's suit[1]":[2306,"equip",500],"aebecee's raging typhoon armor":[2348,"equip",68000],"aebecee's raging typhoon armor[1]":[2349,"equip",68000],"aerial":[5011,"equip",10],"agate":[7291,"misc",1500],"agav card":[4409,"misc",10],"ahlspiess":[1478,"equip",10],"alarm card":[4244,"misc",10],"alcohol":[970,"misc",200],"alice card":[4253,"misc",10],"alice's apron":[7047,"misc",1212],"alicel card":[4401,"misc",10],"aliot card":[4402,"misc",10],"aliza card":[4400,"misc",10],"alligator card":[4252,"misc",10],"aloe":[704,"misc",250],"aloe leaflet":[521,"use",180],"aloevera":[606,"use",750],"am mut card":[4245,"misc",10],"ambernite card":[4032,"misc",10],"amethyst":[719,"misc",3000],"amon ra card":[4236,"misc",10],"amulet":[609,"use",50],"anacondaq card":[4062,"misc",10],"ancient cape":[2507,"equip",41000],"ancient cape[1]":[2525,"equip",41000],"ancient lips":[1054,"misc",500],"ancient magic":[1573,"equip",10],"ancient magic[2]":[1573,"equip",10],"ancient mimic card":[4387,"misc",10],"ancient mummy card":[4248,"misc",10],"ancient tooth":[1053,"misc",274],"ancient worm card":[4249,"misc",10],"andre card":[4043,"misc",10],"andre egg card":[4013,"misc",10],"andvari's ring":[7834,"misc",0],"angel wing":[2254,"equip",10],"angel's kiss":[5125,"equip",5000],"angel's kiss[1]":[5125,"equip",5000],"angel's reincarnation":[2420,"equip",5000],"angel's reincarnation[1]":[2420,"equip",5000],"angelic cardigan":[2521,"equip",5000],"angelic cardigan[1]":[2521,"equip",5000],"angelic guard":[2116,"equip",5000],"angelic guard[1]":[2116,"equip",5000],"angelic protection":[2355,"equip",5000],"angelic protection[1]":[2355,"equip",5000],"angelic ring":[2743,"equip",10],"angeling card":[4054,"misc",10],"angled glasses":[2276,"equip",10],"angry snarl":[5113,"equip",10],"animal gore":[702,"misc",225],"animal skin":[919,"misc",18],"annoyed mask":[5089,"equip",10],"anodyne":[605,"use",1000],"anolian card":[4234,"misc",10],"anolian skin":[7003,"misc",484],"anopheles card":[4344,"misc",10],"ant jaw":[1014,"misc",116],"antelope horn":[7106,"misc",336],"antelope skin":[7107,"misc",378],"antonio card":[4243,"misc",10],"anubis card":[4138,"misc",10],"apocalipse card":[4242,"misc",10],"apple":[512,"use",7],"apple juice":[531,"use",10],"apple of archer":[2285,"equip",10],"aqua elemental card":[4443,"misc",10],"aquamarine":[720,"misc",3000],"arbalest":[1713,"equip",24000],"arbalest[1]":[1713,"equip",24000],"arbalest[2]":[1715,"equip",24000],"arc angeling card":[4241,"misc",10],"arc wand":[1610,"equip",22500],"arc wand[1]":[1610,"equip",22500],"arc wand[2]":[1611,"equip",22500],"archdam card":[4371,"misc",10],"archer skeleton card":[4094,"misc",10],"arclouze card":[4240,"misc",10],"argiope card":[4114,"misc",10],"argos card":[4075,"misc",10],"armeyer dinze card":[4347,"misc",10],"armlet of obedience":[639,"use",9000],"armor charm":[2656,"equip",10000],"armor of naga":[2389,"equip",10],"armor of naga[1]":[2389,"equip",10],"armor piece of dullahan":[7210,"misc",395],"arrow":[1750,"misc",0],"arrow of shadow":[1767,"misc",1],"arrow of wind":[1755,"misc",1],"assassin cross card":[4359,"misc",10],"assassin dagger":[1232,"equip",10],"assassin dagger[1]":[13033,"equip",10],"assassin mask":[5054,"equip",10],"assaulter card":[4246,"misc",10],"aster card":[4247,"misc",10],"asura":[13010,"equip",1500],"asura[2]":[13010,"equip",1500],"asura[3]":[13011,"equip",1500],"atlas weapon":[1175,"equip",10],"atlas weapon[1]":[1175,"equip",10],"atroce card":[4425,"misc",10],"authoritative badge":[662,"use",725],"axe":[1301,"equip",250],"axe[3]":[1301,"equip",250],"axe[4]":[1302,"equip",250],"azoth":[1235,"equip",10],"ba gua":[7169,"misc",1400],"baby desert wolf card":[4023,"misc",10],"baby leopard card":[4233,"misc",10],"bacillus":[7119,"misc",512],"bag of nuts":[7888,"misc",0],"ballista":[1722,"equip",62000],"ballista[1]":[1727,"equip",62000],"banana":[513,"use",7],"banana hat":[5116,"equip",10],"banana juice":[532,"use",10],"bandana":[2211,"equip",200],"banshee card":[4438,"misc",10],"banshee master card":[4450,"misc",10],"bao":[553,"use",0],"bao bao":[5042,"equip",10],"bapho jr. card":[4129,"misc",10],"baphomet card":[4147,"misc",10],"baphomet doll":[750,"misc",9000],"bark shorts":[10017,"equip",10],"baroness of retribution card":[4391,"misc",10],"barren trunk":[1068,"misc",1],"bass guitar":[1919,"equip",10],"bass guitar[1]":[1919,"equip",10],"bastard sword":[1154,"equip",11250],"bastard sword[2]":[1154,"equip",11250],"bastard sword[3]":[1155,"equip",11250],"bat cage":[7214,"misc",440],"bathory card":[4119,"misc",10],"battered kettle":[7323,"misc",128],"battered pot":[10010,"equip",10],"battle axe":[1351,"equip",2700],"battle axe[3]":[1351,"equip",2700],"battle axe[4]":[1352,"equip",2700],"battle fork":[1485,"equip",10],"battle fork[4]":[1485,"equip",10],"battle hook":[1421,"equip",10],"battle hook[1]":[1421,"equip",10],"battle test certificate":[7913,"misc",0],"bazerald":[1231,"equip",10],"bear's footskin":[948,"misc",87],"bee sting":[939,"misc",16],"beetle king card":[4307,"misc",10],"beholder card":[4356,"misc",10],"belt":[2627,"equip",10000],"belt[1]":[2627,"equip",10000],"berdysz":[1375,"equip",10],"berdysz[2]":[1375,"equip",10],"beret":[5172,"equip",15000],"berserk":[1814,"equip",10],"berserk guitar":[1920,"equip",10],"berserk[1]":[1816,"equip",10],"berzebub card":[4145,"misc",10],"bible":[1551,"equip",30000],"bible[2]":[1551,"equip",30000],"big ribbon":[2244,"equip",7500],"big ribbon[1]":[5348,"equip",7500],"bigfoot card":[4074,"misc",10],"bill of birds":[925,"misc",32],"billow":[7091,"misc",0],"binoculars":[2296,"equip",10],"biotite":[7297,"misc",1500],"biretta":[2216,"equip",4500],"biretta[1]":[2217,"equip",4500],"bison horn":[2702,"equip",10],"bison horn[1]":[2702,"equip",10],"bitter herb":[621,"use",10],"black bear skin":[7161,"misc",192],"black cat":[2747,"equip",10],"black cat doll":[7206,"misc",720],"black dyestuffs":[983,"misc",4000],"black hair":[1020,"misc",146],"black ladle":[737,"misc",200],"black leather boots":[2425,"equip",10],"black leather boots[1]":[2434,"equip",10],"blade":[1107,"equip",1450],"blade lost in darkness":[7023,"misc",6000],"blade whip":[1969,"equip",10],"blade[3]":[1107,"equip",1450],"blade[4]":[1108,"equip",1450],"blazer card":[4215,"misc",10],"blessing of water":[12303,"use",0],"blood tears":[1271,"equip",10],"blood tears[2]":[1271,"equip",10],"bloodied shackle ball":[2655,"equip",25000],"bloody axe":[1363,"equip",10],"bloody butterfly card":[4327,"misc",10],"bloody eater":[1182,"equip",10],"bloody eater[2]":[1182,"equip",10],"bloody edge":[7024,"misc",5000],"bloody knight card":[4320,"misc",10],"bloody murderer card":[4214,"misc",10],"bloody page":[7449,"misc",340],"bloody roar":[1265,"equip",10],"bloody rune":[7563,"misc",1008],"blue acidus card":[4379,"misc",10],"blue bijou":[7446,"misc",443],"blue feather":[7441,"misc",704],"blue gemstone":[717,"misc",300],"blue hair":[1034,"misc",171],"blue herb":[510,"use",30],"blue jewel":[7576,"misc",10],"blue potion":[505,"use",2500],"bomb wick":[2279,"equip",10],"bone head":[5398,"equip",10],"bone head[1]":[5398,"equip",10],"bone helm":[5017,"equip",10],"bone helm[1]":[5162,"equip",10],"bongun card":[4212,"misc",10],"bongun hat":[5046,"equip",10],"bongun hat[1]":[5168,"equip",10],"book":[1550,"equip",15000],"book of billows":[1553,"equip",17500],"book of billows[3]":[1568,"equip",17500],"book of gust of wind":[1556,"equip",17500],"book of gust of wind[3]":[1571,"equip",17500],"book of mother earth":[1554,"equip",17500],"book of mother earth[3]":[1569,"equip",17500],"book of the apocalypse":[1557,"equip",30000],"book of the blazing sun":[1555,"equip",17500],"book of the devil":[642,"use",900],"book[3]":[1550,"equip",15000],"bookclip in memory":[7015,"misc",1500],"boots":[2405,"equip",9000],"boots[1]":[2406,"equip",9000],"bow":[1701,"equip",500],"bow guardian card":[4428,"misc",10],"bow thimble":[2619,"equip",5000],"bow thimble[1]":[2671,"equip",5000],"bow[3]":[1701,"equip",500],"bow[4]":[1702,"equip",500],"bowman scarf":[2727,"equip",10],"box of resentment":[12030,"use",500],"boy's pure heart":[12373,"use",10],"bradium shield":[2138,"equip",10],"bradium shield[1]":[2138,"equip",10],"bradium stone hammer":[1385,"equip",10],"branch":[13150,"equip",1500],"branch[3]":[13150,"equip",1500],"bread":[580,"use",75],"breath of spirit":[7087,"misc",0],"breeze card":[4390,"misc",10],"brigan":[7054,"misc",373],"brilight card":[4213,"misc",10],"brionac":[1470,"equip",10],"broad sword":[1160,"equip",32500],"broad sword[1]":[1160,"equip",32500],"broad sword[2]":[1162,"equip",32500],"brocca":[1415,"equip",10],"broken crown":[7754,"misc",1500],"broken farming utensil":[7753,"misc",165],"broken liquor jar":[7158,"misc",80],"broken needle":[7215,"misc",345],"broken pharaoh emblem":[7113,"misc",1008],"broken shell":[7070,"misc",450],"broken shuriken":[7156,"misc",235],"broken sword":[6071,"misc",0],"brooch":[2605,"equip",15000],"brooch[1]":[2625,"equip",15000],"brown root":[7188,"misc",280],"brynhild armor piece":[7832,"misc",0],"bucket hat":[5114,"equip",3000],"bucket hat[1]":[5120,"equip",3000],"buckler":[2103,"equip",7000],"buckler[1]":[2104,"equip",7000],"bug leg":[1042,"misc",215],"burning bow":[1730,"equip",10],"burning bow[1]":[1730,"equip",10],"burning hair":[7122,"misc",487],"burning heart":[7097,"misc",462],"burning horseshoe":[7120,"misc",411],"burning passion guitar":[1914,"equip",10],"burnt part":[7512,"misc",800],"burnt tree":[7068,"misc",361],"buster":[1357,"equip",17000],"buster[1]":[1357,"equip",17000],"buster[2]":[1358,"equip",17000],"butcher":[13158,"equip",65000],"butcher[1]":[13159,"equip",65000],"butterfly wing":[602,"use",150],"byeollungum":[1140,"equip",10],"byorgue card":[4426,"misc",10],"cacao":[7182,"misc",100],"cactus needle":[952,"misc",41],"cake hat":[5024,"equip",10],"candy":[529,"use",5],"candy cane":[530,"use",10],"cap":[2226,"equip",6000],"cap[1]":[2227,"equip",6000],"caramel card":[4063,"misc",10],"carat card":[4288,"misc",10],"cardo":[1484,"equip",10],"cardo[1]":[1484,"equip",10],"carrot":[515,"use",7],"carrot juice":[534,"use",10],"carrot whip":[1974,"equip",10],"cat o' nine tails card":[4290,"misc",10],"cat tread":[7080,"misc",0],"cat's eye":[7263,"misc",477],"caterpillar card":[4289,"misc",10],"cecil damon card":[4368,"misc",10],"celebrant's mitten":[2617,"equip",1],"cello":[1925,"equip",10],"cello[3]":[1925,"equip",10],"centipede card":[4447,"misc",10],"centipede larva card":[4452,"misc",10],"chain":[1519,"equip",11500],"chain mail":[2314,"equip",32500],"chain mail[1]":[2315,"equip",32500],"chain[2]":[1519,"equip",11500],"chain[3]":[1520,"equip",11500],"chakram":[1285,"equip",10],"chakram[2]":[1285,"equip",10],"chameleon armor":[2386,"equip",10],"cheese":[548,"use",1400],"chef king orleans vol.1":[11002,"misc",4000],"chemeti whip":[1964,"equip",10],"chepet card":[4284,"misc",10],"chimera card":[4300,"misc",10],"china":[736,"misc",500],"chivalry emblem":[1004,"misc",1],"choco card":[4285,"misc",10],"chocolate":[558,"use",0],"chonchon card":[4009,"misc",10],"chonchon doll":[742,"misc",1500],"christmas cookie card":[4235,"misc",10],"chrysalis":[915,"misc",4],"cigarette":[2267,"equip",10],"cinquedea":[1245,"equip",20000],"cinquedea[1]":[1245,"equip",20000],"cinquedea[2]":[1246,"equip",20000],"circlet":[2232,"equip",3750],"circlet[1]":[2233,"equip",3750],"citrin":[7295,"misc",1500],"clam flesh":[966,"misc",79],"clam shell":[965,"misc",28],"clattering skull":[7752,"misc",420],"claw":[1809,"equip",33500],"claw of desert wolf":[7030,"misc",104],"claw of monkey":[7011,"misc",233],"claw of rat":[7007,"misc",374],"claw[1]":[1809,"equip",33500],"claw[2]":[1810,"equip",33500],"claymore":[1163,"equip",37000],"claymore[2]":[1172,"equip",37000],"claytos cracking earth armor":[2350,"equip",68000],"claytos cracking earth armor[1]":[2351,"equip",68000],"clip":[2607,"equip",15000],"clip[1]":[2607,"equip",15000],"clock card":[4299,"misc",10],"cloud crumb":[7162,"misc",195],"cloud hermit card":[4262,"misc",10],"clover":[705,"misc",5],"clown nose":[2262,"equip",10],"club":[1501,"equip",60],"club[3]":[1501,"equip",60],"club[4]":[1502,"equip",60],"coal":[1003,"misc",250],"coat":[2309,"equip",11000],"coat[1]":[2310,"equip",11000],"cobweb":[1025,"misc",92],"coco card":[4041,"misc",10],"cogwheel":[7093,"misc",756],"coif":[5092,"equip",75000],"coif[1]":[5093,"equip",75000],"cold heart":[2746,"equip",10],"cold medicine":[12257,"use",10],"cold moonlight":[7837,"misc",0],"combat knife":[1228,"equip",10],"combo battle glove":[1822,"equip",10],"combo battle glove[4]":[1822,"equip",10],"composite bow":[1704,"equip",1250],"composite bow[3]":[1704,"equip",1250],"composite bow[4]":[1705,"equip",1250],"concentration potion":[645,"use",400],"conch":[961,"misc",79],"condensed white potion":[547,"use",825],"condensed yellow potion":[546,"use",300],"condor card":[4015,"misc",10],"contorted self-portrait":[7223,"misc",1016],"contract in shadow":[641,"use",50],"cooked nine tail's tails":[12100,"use",50000],"cookie card":[4293,"misc",10],"coral reef":[7013,"misc",386],"cornus card":[4448,"misc",10],"cornutus card":[4061,"misc",10],"coronet":[2249,"equip",10],"corsair":[5019,"equip",10],"corsair[1]":[5163,"equip",10],"cotton shirt":[2301,"equip",5],"cotton shirt[1]":[2302,"equip",5],"countermagic crystal":[7578,"misc",10],"cowardice blade":[13003,"equip",26000],"cowardice blade[1]":[13003,"equip",26000],"cowardice blade[2]":[13004,"equip",26000],"crab card":[4153,"misc",10],"crab shell":[964,"misc",45],"cracked diamond":[733,"misc",5],"cramp card":[4296,"misc",10],"creamy card":[4040,"misc",10],"creamy fear card":[4298,"misc",10],"crescent scythe":[1466,"equip",10],"crescent scythe[1]":[1476,"equip",10],"crest piece":[7356,"misc",2500],"crimson bolt":[13102,"equip",10000],"crimson bolt[1]":[13102,"equip",10000],"crimson bolt[2]":[13103,"equip",10000],"critical ring":[2616,"equip",37500],"croce staff":[1647,"equip",10],"croce staff[1]":[1647,"equip",10],"cross shield":[2130,"equip",10],"cross shield[1]":[2130,"equip",10],"crossbow":[1710,"equip",8500],"crossbow[2]":[1710,"equip",8500],"crossbow[3]":[1711,"equip",8500],"crown":[2235,"equip",10],"crown[1]":[5165,"equip",10],"cruiser card":[4297,"misc",10],"crystal arrow":[1754,"misc",1],"crystal blue":[991,"misc",500],"crystal fragment":[7321,"misc",276],"crystal key":[7839,"misc",0],"crystal mirror":[747,"misc",7500],"crystal of darkness":[7799,"misc",5],"crystal pumps":[2407,"equip",10],"crystalized teardrop":[6075,"misc",0],"cultish masque":[1045,"misc",206],"cursed baphomet doll":[6004,"misc",0],"cursed dagger":[1241,"equip",40000],"cursed hand":[2728,"equip",10],"cursed hand[1]":[2728,"equip",10],"cursed lyre":[1741,"equip",10],"cursed lyre[1]":[1741,"equip",10],"cursed ruby":[724,"misc",300],"cursed seal":[7442,"misc",666],"cursed star":[2748,"equip",10],"cursed water":[12020,"use",1],"curved sword":[13405,"equip",10],"curved sword[2]":[13405,"equip",10],"cute ribbon":[2250,"equip",250],"cutlus":[1135,"equip",10],"cutlus[1]":[13400,"equip",10],"cutter":[1204,"equip",625],"cutter[3]":[1204,"equip",625],"cutter[4]":[1205,"equip",625],"cyclone":[13151,"equip",8750],"cyclone[1]":[13151,"equip",8750],"cyclone[2]":[13152,"equip",8750],"cyfar":[7053,"misc",386],"daenggie":[901,"misc",130],"dagger":[1213,"equip",7000],"dagger of counter":[1242,"equip",60000],"dagger of hunter":[13038,"equip",10],"dagger of hunter[3]":[13038,"equip",10],"dagger[2]":[1213,"equip",7000],"dagger[3]":[1214,"equip",7000],"damascus":[1222,"equip",24500],"damascus[1]":[1222,"equip",24500],"damascus[2]":[1226,"equip",24500],"dame of sentinel card":[4392,"misc",10],"dark bacilium":[5808,"equip",10],"dark bacilium[1]":[5808,"equip",10],"dark blinder":[5104,"equip",10],"dark crystal fragment":[7315,"misc",211],"dark frame card":[4170,"misc",10],"dark illusion card":[4169,"misc",10],"dark lord card":[4168,"misc",10],"dark mask":[7157,"misc",157],"dark piece":[6089,"misc",500],"dark priest card":[4171,"misc",10],"dark red scale":[6091,"misc",100000],"dark shadow card":[4449,"misc",10],"darkgreen dyestuffs":[979,"misc",4000],"dawn essence":[7836,"misc",0],"dea staff":[2005,"equip",10],"dea staff[1]":[2005,"equip",10],"dead branch":[604,"use",25],"dead branch box":[12999,"use",10],"dead tree cane":[1643,"equip",10],"deadly noxious herb":[631,"use",10],"death guidance":[1186,"equip",10],"death guidance[2]":[1186,"equip",10],"death word card":[4388,"misc",10],"decayed nail":[957,"misc",41],"decomposed rope":[7218,"misc",195],"demon pungus card":[4173,"misc",10],"denture from dragon mask":[7266,"misc",218],"desert twilight":[13034,"equip",10],"desert twilight[2]":[13034,"equip",10],"desert wolf card":[4082,"misc",10],"despero of thanatos card":[4397,"misc",10],"destroyed armor":[7069,"misc",521],"destroyer":[13160,"equip",55000],"destroyer[1]":[13161,"equip",55000],"detardeurus card":[4386,"misc",10],"detonator":[1051,"misc",225],"detrimindexta":[971,"misc",200],"deviace card":[4125,"misc",10],"devil's cattle ring":[7930,"misc",0],"deviling card":[4174,"misc",10],"deviruchi card":[4122,"misc",10],"dew laden moss":[630,"use",5],"diabolic card":[4182,"misc",10],"diabolus armor":[2375,"equip",10],"diabolus armor[1]":[2375,"equip",10],"diabolus boots":[2433,"equip",10],"diabolus boots[1]":[2433,"equip",10],"diabolus manteau":[2537,"equip",10],"diabolus manteau[1]":[2537,"equip",10],"diabolus ring":[2729,"equip",10],"diabolus ring[1]":[2729,"equip",10],"diabolus robe":[2374,"equip",10],"diabolus robe[1]":[2374,"equip",10],"diamond ring":[2613,"equip",22500],"dimik card":[4370,"misc",10],"dirk":[1210,"equip",4250],"dirk[2]":[1210,"equip",4250],"dirk[3]":[1211,"equip",4250],"disguise card":[4181,"misc",10],"divine cloth":[2366,"equip",10],"divine cloth[1]":[2366,"equip",10],"divine cross":[2001,"equip",10],"dokebi card":[4098,"misc",10],"dokebi horn":[1021,"misc",146],"dolor of thanatos card":[4398,"misc",10],"doom slayer":[1370,"equip",10],"doom slayer[1]":[1371,"equip",10],"doppelganger card":[4142,"misc",10],"double bound":[1736,"equip",10],"double bound[3]":[1736,"equip",10],"draco card":[4444,"misc",10],"dracula card":[4134,"misc",10],"dragon breath":[2527,"equip",10],"dragon breath cocktail":[12080,"use",50000],"dragon breath[1]":[2527,"equip",10],"dragon canine":[1035,"misc",242],"dragon egg card":[4385,"misc",10],"dragon fly card":[4179,"misc",10],"dragon horn":[7265,"misc",272],"dragon killer":[13001,"equip",10],"dragon killer[2]":[13030,"equip",10],"dragon scale":[1036,"misc",250],"dragon skin":[7123,"misc",512],"dragon slayer":[1166,"equip",10],"dragon slayer[2]":[1180,"equip",10],"dragon tail":[1037,"misc",600],"dragon tail card":[4178,"misc",10],"dragon wing":[1724,"equip",10],"dragon's mane":[6073,"misc",0],"dragonball yellow":[7858,"misc",10],"drainliar card":[4069,"misc",10],"drake card":[4137,"misc",10],"drifter":[13157,"equip",40000],"drifter[1]":[13157,"equip",40000],"drifting air":[7092,"misc",0],"drill katar":[1270,"equip",10],"drill katar[1]":[1270,"equip",10],"driller card":[4180,"misc",10],"drops card":[4004,"misc",10],"drosera card":[4421,"misc",10],"dry sand":[7264,"misc",161],"dryad card":[4177,"misc",10],"dullahan card":[4176,"misc",10],"dumpling child card":[4154,"misc",10],"dusk":[13153,"equip",11750],"dusk glow":[7835,"misc",0],"dusk[1]":[13153,"equip",11750],"dust pollutant":[7320,"misc",128],"dustiness card":[4056,"misc",10],"eagle wing":[2515,"equip",10000],"eagle wing[1]":[2515,"equip",10000],"ear muffs":[2283,"equip",10],"earring":[2602,"equip",15000],"earring[1]":[2622,"equip",15000],"earth bow":[1732,"equip",10],"earth bow[1]":[1732,"equip",10],"earth deleter card":[4279,"misc",10],"earth petite card":[4118,"misc",10],"earthworm peeling":[1055,"misc",98],"earthworm the dude":[623,"use",2000],"echio card":[4410,"misc",10],"eclipse card":[4266,"misc",10],"ectoplasm":[7220,"misc",161],"eddga card":[4123,"misc",10],"edge":[1132,"equip",10],"edible mushroom":[581,"use",20],"egg":[574,"use",10],"egg shell":[5015,"equip",10],"eggyra card":[4070,"misc",10],"egnigem cenia card":[4346,"misc",10],"elastic band":[7200,"misc",190],"elder card":[4251,"misc",10],"elder pixie's moustache":[1040,"misc",116],"elder willow card":[4052,"misc",10],"electric eel":[1972,"equip",10],"electric eel[2]":[1972,"equip",10],"electric fist":[1820,"equip",10],"electric fist[3]":[1820,"equip",10],"electric wire":[1971,"equip",10],"elemental sword":[13414,"equip",10],"elemental sword[3]":[13414,"equip",10],"elunium":[985,"misc",550],"elven ears":[2286,"equip",10],"elven ears[1]":[18507,"equip",10],"emblem of the sun god":[7086,"misc",0],"emerald":[721,"misc",3000],"emperium":[714,"misc",1],"empty bottle":[713,"misc",3],"emveretarcon":[1011,"misc",500],"enchanted peach tree card":[4217,"misc",10],"encyclopedia":[1564,"equip",10],"encyclopedia[2]":[1564,"equip",10],"engrave treasure box":[7781,"misc",0],"entweihen crothen card":[4451,"misc",10],"episode 13.1 poporing key":[7782,"misc",0],"episode 13.2 poring key":[7783,"misc",0],"eraser":[1637,"equip",10],"erde":[16000,"equip",10],"erde[2]":[16000,"equip",10],"eremes guile card":[4360,"misc",10],"errende ebecee card":[4349,"misc",10],"event treasure box":[12281,"use",10],"evil bone wand":[1615,"equip",10],"evil druid card":[4141,"misc",10],"evil horn":[923,"misc",600],"evil mind":[7583,"misc",5],"evil nymph card":[4258,"misc",10],"evil snake lord card":[4330,"misc",10],"evil wing":[2255,"equip",10],"executioner card":[4250,"misc",10],"executioner's mitten":[7017,"misc",2250],"exorciser":[1233,"equip",10],"exorcism bible":[2129,"equip",10],"expert ring":[2703,"equip",10],"expert ring[1]":[2703,"equip",10],"explosion card":[4267,"misc",10],"eye of dullahan":[2614,"equip",45000],"eye of hellion":[7337,"misc",0],"eye stone ring":[2783,"equip",10],"eye stone ring[1]":[2783,"equip",10],"fabre card":[4002,"misc",10],"fabric":[1059,"misc",153],"falchion":[1104,"equip",750],"falchion[3]":[1104,"equip",750],"falchion[4]":[1105,"equip",750],"falcon muffler":[2516,"equip",15000],"falken blitz":[1745,"equip",0],"falken blitz[2]":[1745,"equip",0],"fallen bishop hibram card":[4441,"misc",10],"false angel card":[4316,"misc",10],"familiar card":[4020,"misc",10],"fancy flower":[2207,"equip",10],"fang":[1063,"misc",340],"fang of hatii":[7036,"misc",50],"fantastic cooking kit":[12129,"use",5000],"fatty chubby earthworm":[632,"use",2500],"feather":[949,"misc",10],"feather of angel wing":[7079,"misc",0],"feather of birds":[916,"misc",5],"female thief bug card":[4026,"misc",10],"festival mask":[7187,"misc",50],"fig leaf":[7298,"misc",269],"fin":[951,"misc",206],"fin helm":[5014,"equip",10],"fine grit":[7041,"misc",60],"fine sand":[7043,"misc",50],"fine-grained trunk":[1066,"misc",1],"finger":[1811,"equip",29000],"finger[1]":[1811,"equip",29000],"finger[2]":[1812,"equip",29000],"fire arrow":[1752,"misc",1],"fire dragon scale":[7451,"misc",926],"fireblend":[1133,"equip",10],"firecracker":[12018,"use",1],"firelock soldier card":[4160,"misc",10],"fish tail":[1023,"misc",98],"fisherman's dagger":[1249,"equip",5000],"flail":[1510,"equip",8000],"flail[2]":[1510,"equip",8000],"flail[3]":[1511,"equip",8000],"flame heart":[994,"misc",1500],"flame manteau of naght sieger":[2542,"equip",10],"flame manteau of naght sieger[1]":[2542,"equip",10],"flame skull card":[4439,"misc",10],"flashlight":[7327,"misc",512],"flexible tube":[7325,"misc",51],"flora card":[4080,"misc",10],"flower":[712,"misc",1],"flower ring":[2612,"equip",750],"fluff":[914,"misc",4],"fluorescent liquid":[7326,"misc",356],"fly wing":[601,"use",30],"folding fan of cat ghost":[7262,"misc",233],"foolishness of the blind":[7021,"misc",10],"forbidden red candle":[660,"use",10000],"formal suit":[2320,"equip",10],"formal suit[1]":[2320,"equip",10],"fortune sword":[1223,"equip",10],"four leaf clover":[706,"misc",40000],"fragment":[7094,"misc",672],"fragment of agony":[7436,"misc",753],"fragment of darkness":[7798,"misc",250],"fragment of despair":[7439,"misc",753],"fragment of hatred":[7438,"misc",753],"fragment of misery":[7437,"misc",753],"fragment of rossata stone":[7211,"misc",1300],"freezer card":[4319,"misc",10],"fresh fish":[579,"use",125],"freya's jewel":[7073,"misc",0],"fricca's circlet":[5124,"equip",15000],"fricco's shoes":[2417,"equip",15000],"frill":[1012,"misc",125],"frilldora card":[4088,"misc",10],"frozen bow":[1731,"equip",10],"frozen bow[1]":[1731,"equip",10],"frozen rose":[749,"misc",17500],"frus card":[4405,"misc",10],"full plate":[2316,"equip",40000],"full plate[1]":[2317,"equip",40000],"fur":[6020,"misc",352],"gae bolg":[1474,"equip",10],"gae bolg[2]":[1480,"equip",10],"gaia sword":[1143,"equip",10],"gaia whip":[1967,"equip",10],"gajomart card":[4151,"misc",10],"gakkung bow":[1714,"equip",21000],"gakkung bow[1]":[1714,"equip",21000],"gakkung bow[2]":[1716,"equip",21000],"galapago cap":[5111,"equip",10],"galapago card":[4152,"misc",10],"galion card":[4423,"misc",10],"gangster mask":[2265,"equip",10],"gargoyle card":[4149,"misc",10],"garlet":[910,"misc",20],"garnet":[718,"misc",3000],"garrison":[13104,"equip",24000],"garrison[1]":[13104,"equip",24000],"garrison[2]":[13105,"equip",24000],"gas mask":[5005,"equip",10],"gate keeper":[13156,"equip",28000],"gate keeper-dd":[13167,"equip",36000],"gazeti card":[4418,"misc",10],"gemini-s58 card":[4354,"misc",10],"gemmed sallet":[2230,"equip",25000],"gemmed sallet[1]":[2231,"equip",25000],"gemstone":[7300,"misc",710],"general egnigem cenia card":[4352,"misc",10],"gentle breeze guitar":[1917,"equip",10],"gentleman's staff":[1629,"equip",10],"gentleman's staff[1]":[1629,"equip",10],"geographer card":[4280,"misc",10],"ghost bandana":[2274,"equip",10],"ghostring card":[4047,"misc",10],"ghoul card":[4110,"misc",10],"giant axe":[1387,"equip",10],"giant axe[1]":[1387,"equip",10],"giant butterfly wing":[7168,"misc",307],"giant hornet card":[4271,"misc",10],"giant spider card":[4270,"misc",10],"giant whisper card":[4303,"misc",10],"gibbet card":[4278,"misc",10],"giearth card":[4087,"misc",10],"gift box":[644,"use",500],"gig card":[4165,"misc",10],"gill":[956,"misc",171],"ginnungagap":[13002,"equip",10],"ginnungagap[1]":[13019,"equip",10],"girl's diary":[1558,"equip",750],"girl's diary[1]":[1558,"equip",750],"glacial heart":[7561,"misc",303],"gladius":[1219,"equip",21500],"gladius[2]":[1219,"equip",21500],"gladius[3]":[1220,"equip",21500],"glaive":[1454,"equip",10000],"glaive[2]":[1454,"equip",10000],"glaive[3]":[1455,"equip",10000],"glass bead":[746,"misc",700],"glitter shell":[7009,"misc",264],"glittering jacket":[2319,"equip",10],"glittering jacket[1]":[2319,"equip",10],"gloom under night card":[4408,"misc",10],"glossy hair":[7152,"misc",170],"glove":[2604,"equip",15000],"glove[1]":[2624,"equip",15000],"goat card":[4150,"misc",10],"goblin archer card":[4157,"misc",10],"goblin card":[4060,"misc",10],"goblin leader card":[4155,"misc",10],"goblin leader mask":[5090,"equip",10],"goblin mask":[2297,"equip",10],"goblin steamrider card":[4156,"misc",10],"goddess of fortune's cursed brooch":[2652,"equip",10],"goddess tear":[7830,"misc",0],"goggles":[2224,"equip",10],"goggles[1]":[2225,"equip",10],"goibne's armor":[2354,"equip",25000],"goibne's greaves":[2419,"equip",15000],"goibne's helm":[5128,"equip",15000],"goibne's spaulders":[2520,"equip",15000],"gold":[969,"misc",100000],"gold acidus card":[4378,"misc",10],"gold coin":[671,"misc",5000],"gold lux":[13106,"equip",50000],"gold ring":[2610,"equip",15000],"golden bell":[10016,"equip",10],"golden gear":[2246,"equip",10],"golden gear[1]":[5159,"equip",10],"golden hair":[1060,"misc",215],"golden mace":[1524,"equip",10],"golden mace[1]":[1524,"equip",10],"golden mace[2]":[1539,"equip",10],"golden ornament":[7435,"misc",953],"golden thief bug card":[4128,"misc",10],"golem card":[4072,"misc",10],"grampa beard":[2241,"equip",2500],"grand circlet":[5007,"equip",10],"grand cross":[1528,"equip",10],"grand cross[1]":[1540,"equip",10],"grand peco card":[4161,"misc",10],"grape":[514,"use",100],"grape juice":[533,"use",125],"grasshopper's leg":[940,"misc",18],"grave keeper's sword":[10020,"equip",10],"great axe":[1364,"equip",10],"great bow":[1707,"equip",5000],"great bow[2]":[1707,"equip",5000],"great bow[3]":[1708,"equip",5000],"great nature":[997,"misc",1500],"greatest general card":[4283,"misc",10],"greaves":[2411,"equip",24000],"greaves[1]":[2412,"equip",27000],"green acre guitar":[1916,"equip",10],"green ale":[12135,"use",10],"green bijou":[7445,"misc",443],"green feeler":[2298,"equip",10],"green ferus card":[4381,"misc",10],"green herb":[511,"use",5],"green lace":[10015,"equip",10],"green live":[993,"misc",500],"green maiden card":[4373,"misc",10],"gremlin card":[4355,"misc",10],"grimtooth":[1237,"equip",10],"grit":[1056,"misc",153],"grizzly card":[4162,"misc",10],"grove card":[4377,"misc",10],"gryphon card":[4163,"misc",10],"guard":[2101,"equip",250],"guard[1]":[2102,"equip",250],"guillotine":[1369,"equip",10],"guisarme":[1451,"equip",6500],"guisarme[2]":[1451,"equip",6500],"guisarme[3]":[1452,"equip",6500],"guitar":[1907,"equip",23500],"guitar[1]":[1908,"equip",23500],"gulaman":[7743,"misc",1],"gullinbursti card":[4164,"misc",10],"gungnir":[1413,"equip",10],"gungnir[2]":[1418,"equip",10],"gust bow":[1733,"equip",10],"gust bow[1]":[1733,"equip",10],"haedonggum":[1123,"equip",25000],"haedonggum[1]":[1123,"equip",25000],"haedonggum[2]":[1128,"equip",25000],"hair band":[2210,"equip",250],"hakujin":[13014,"equip",10],"hakujin[1]":[13015,"equip",10],"halberd":[1463,"equip",27000],"halberd[1]":[1463,"equip",27000],"halberd[2]":[1464,"equip",27000],"halo":[2282,"equip",10],"hammer":[1354,"equip",7750],"hammer of blacksmith":[1005,"misc",1],"hammer[2]":[1354,"equip",7750],"hammer[3]":[1355,"equip",7750],"hand of god":[1009,"misc",1],"handcuffs":[7345,"misc",362],"hard feeler":[7163,"misc",285],"hard skin":[6022,"misc",442],"hardcover book":[1561,"equip",10],"hardcover book[1]":[1561,"equip",10],"harp":[1909,"equip",31000],"harp of nepenthes":[1926,"equip",10],"harp of nepenthes[2]":[1926,"equip",10],"harp[1]":[1909,"equip",31000],"harp[2]":[1910,"equip",31000],"harpy card":[4325,"misc",10],"harpy feather":[7115,"misc",571],"harpy talon":[7116,"misc",605],"hat":[2220,"equip",500],"hat of the sun god":[5022,"equip",10],"hat of the sun god[1]":[5353,"equip",10],"hat[1]":[2221,"equip",500],"hatii babe card":[4323,"misc",10],"hatii card":[4324,"misc",10],"hatii claw":[1815,"equip",10],"hatii claw[1]":[1815,"equip",10],"hazy starlight":[7838,"misc",0],"healing staff":[1625,"equip",10],"heart breaker":[1376,"equip",10],"heart breaker[1]":[1376,"equip",10],"heart of mermaid":[950,"misc",132],"heater card":[4331,"misc",10],"heavenly maiden robe":[2513,"equip",10],"heavenly maiden robe[1]":[2513,"equip",10],"hell poodle card":[4437,"misc",10],"hellfire":[1471,"equip",10],"helm":[2228,"equip",22000],"helm of angel":[5025,"equip",10],"helm of dullahan":[7209,"misc",675],"helm[1]":[2229,"equip",22000],"hermit plant card":[4232,"misc",10],"hero's remains":[7833,"misc",0],"heroic emblem":[968,"misc",1500],"high fashion sandals":[2422,"equip",12000],"high fashion sandals[1]":[2422,"equip",12000],"high heels":[2409,"equip",4250],"high heels[1]":[2432,"equip",4250],"high orc card":[4322,"misc",10],"high priest card":[4363,"misc",10],"high wizard card":[4365,"misc",10],"hill wind card":[4345,"misc",10],"hillsrion card":[4453,"misc",10],"hinalle":[703,"misc",250],"hinalle leaflet":[520,"use",75],"hode card":[4081,"misc",10],"hodremlin card":[4413,"misc",10],"hoe":[6010,"misc",0],"holden card":[4343,"misc",10],"holiday hat":[5097,"equip",0],"holy arrow quiver":[12183,"use",1],"holy avenger":[1145,"equip",225000],"holy guard":[2110,"equip",42500],"holy robe":[2327,"equip",10],"holy robe[1]":[2373,"equip",10],"holy stick":[1631,"equip",10],"holy stick[1]":[1631,"equip",10],"holy water":[523,"use",10],"hometown gift":[12194,"use",10],"honey":[518,"use",250],"honey pot":[7121,"misc",311],"hood":[2501,"equip",500],"hood[1]":[2502,"equip",500],"horn":[947,"misc",58],"horn card":[4045,"misc",10],"horn of hillslion":[1825,"equip",10],"horn of hillslion[3]":[1825,"equip",10],"horn of tendrilion":[6033,"misc",250],"hornet card":[4019,"misc",10],"horong card":[4103,"misc",10],"horrendous hair":[1048,"misc",400],"horrendous mouth":[958,"misc",195],"horseshoe":[944,"misc",294],"howard alt-eisen card":[4362,"misc",10],"huge leaf":[7198,"misc",305],"hung doll":[7212,"misc",510],"hunter fly card":[4115,"misc",10],"hunting spear":[1422,"equip",10],"hunting spear[1]":[1422,"equip",10],"hurricane's fury":[1377,"equip",10],"hurricane's fury[1]":[1377,"equip",10],"huuma blaze shuriken":[13303,"equip",39000],"huuma calm mind":[13304,"equip",10],"huuma calm mind[2]":[13304,"equip",10],"huuma giant wheel shuriken":[13301,"equip",20000],"huuma giant wheel shuriken[3]":[13301,"equip",20000],"huuma giant wheel shuriken[4]":[13302,"equip",20000],"huuma wing shuriken":[13300,"equip",45000],"hwergelmir's tonic":[12095,"use",50000],"hydra card":[4035,"misc",10],"hydrolancer card":[4384,"misc",10],"hylozoist card":[4321,"misc",10],"hypnotist's staff":[1621,"equip",21500],"hypnotist's staff[1]":[1621,"equip",21500],"hypnotist's staff[2]":[1622,"equip",10],"icarus wings":[2726,"equip",10],"ice cream":[536,"use",75],"ice cubic":[7066,"misc",330],"ice falchion":[1131,"equip",10],"ice fireworks":[12374,"use",10],"ice pick":[1230,"equip",10],"ice pick[1]":[13017,"equip",10],"ice scale":[7562,"misc",1510],"ice titan card":[4417,"misc",10],"icicle fist":[1819,"equip",10],"icicle fist[3]":[1819,"equip",10],"icicle whip":[1966,"equip",10],"ifrit card":[4430,"misc",10],"illusion flower":[710,"misc",500],"immaterial arrow quiver":[12014,"use",1],"immaterial sword":[1141,"equip",10],"immortal heart":[929,"misc",187],"immortal stew":[12085,"use",50000],"imp card":[4433,"misc",10],"improved tights":[2390,"equip",10],"improved tights[1]":[2390,"equip",10],"incubus card":[4269,"misc",10],"incubus horn":[5072,"equip",10],"indian fillet":[5010,"equip",10],"infiltrator":[1261,"equip",28500],"infiltrator[1]":[1266,"equip",28500],"injustice card":[4268,"misc",10],"insect feeler":[928,"misc",57],"insect leg":[7316,"misc",329],"inverse scale":[1269,"equip",10],"iron":[998,"misc",50],"iron cain":[2266,"equip",10],"iron driver":[1529,"equip",10],"iron fist card":[4239,"misc",10],"iron maiden":[7075,"misc",0],"iron ore":[1002,"misc",25],"iron wrist":[2719,"equip",10],"isilla card":[4412,"misc",10],"isis card":[4116,"misc",10],"ivory knife":[13039,"equip",10],"ivory knife[2]":[13039,"equip",10],"ivory lance":[1483,"equip",10],"ivory lance[1]":[1483,"equip",10],"ixion wings":[1737,"equip",10],"ixion wings[1]":[1737,"equip",10],"izidor":[709,"misc",250],"jack o' pumpkin":[1062,"misc",187],"jacket":[2303,"equip",100],"jacket[1]":[2304,"equip",100],"jade plate":[7884,"misc",0],"jakk card":[4109,"misc",10],"jamadhar":[1254,"equip",18600],"jamadhar[1]":[1255,"equip",18600],"javelin":[1401,"equip",75],"javelin[3]":[1401,"equip",75],"javelin[4]":[1402,"equip",75],"jellopy":[909,"misc",3],"jelly bean":[7861,"misc",0],"jewel crown":[5002,"equip",10],"jewel of destruction":[7582,"misc",5],"jeweled sword":[1142,"equip",10],"jing guai card":[4265,"misc",10],"jitte":[13007,"equip",10000],"jitte[1]":[13008,"equip",10000],"joker card":[4139,"misc",10],"joker jester":[5003,"equip",10],"jubilee":[7312,"misc",16],"jur":[1250,"equip",9750],"jur[2]":[1250,"equip",9750],"jur[3]":[1251,"equip",9750],"kafra legend vol.1":[11003,"misc",4000],"kaho card":[4065,"misc",10],"kamaitachi":[13009,"equip",24000],"kandura":[2388,"equip",10],"kandura[1]":[2388,"equip",10],"kaong":[7742,"misc",1],"kapha card":[4287,"misc",10],"karakasa card":[4286,"misc",10],"karvodailnirol":[972,"misc",200],"kasa card":[4431,"misc",10],"katana":[1116,"equip",1000],"katana[3]":[1116,"equip",1000],"katana[4]":[1117,"equip",1000],"katar":[1252,"equip",20500],"katar of frozen icicle":[1256,"equip",22500],"katar of frozen icicle[3]":[1275,"equip",22500],"katar of piercing wind":[1259,"equip",22500],"katar of piercing wind[3]":[1278,"equip",22500],"katar of quaking":[1257,"equip",22500],"katar of quaking[3]":[1276,"equip",22500],"katar of raging blaze":[1258,"equip",22500],"katar of raging blaze[3]":[1277,"equip",22500],"katar[1]":[1252,"equip",20500],"katar[2]":[1253,"equip",20500],"kathryne keyron card":[4366,"misc",10],"katzbalger":[1170,"equip",10],"kavach icarus card":[4351,"misc",10],"key of clock tower":[7026,"misc",50],"key of underground":[7027,"misc",50],"khalitzburg card":[4136,"misc",10],"khukri":[13006,"equip",120000],"kiel-d-01 card":[4403,"misc",10],"killer mantis card":[4301,"misc",10],"kitchen knife":[1229,"equip",10],"kitty band":[2213,"equip",10],"knife":[1201,"equip",25],"knife[3]":[1201,"equip",25],"knife[4]":[1202,"equip",25],"knocker card":[4434,"misc",10],"kobold archer card":[4292,"misc",10],"kobold card":[4091,"misc",10],"kobold leader card":[4291,"misc",10],"kraben card":[4295,"misc",10],"krasnaya":[1189,"equip",10],"krasnaya[3]":[1189,"equip",10],"krierg":[13046,"equip",10],"krierg[3]":[13046,"equip",10],"krishna":[1284,"equip",10],"krishna[2]":[1284,"equip",10],"kronos":[2004,"equip",10],"ktullanux card":[4419,"misc",10],"kukre card":[4027,"misc",10],"la'cryma stick":[1646,"equip",10],"la'cryma stick[2]":[1646,"equip",10],"lady solace card":[4394,"misc",10],"lady tanee card":[4376,"misc",10],"lance":[1410,"equip",30000],"langka":[7747,"misc",1],"lantern":[1041,"misc",125],"large jellopy":[7126,"misc",420],"lariat whip":[1962,"equip",10],"laurell weinder card":[4350,"misc",10],"lava":[7096,"misc",554],"lava golem card":[4184,"misc",10],"leaf cat card":[4195,"misc",10],"leather of tendrilion":[2544,"equip",10],"leather of tendrilion[1]":[2544,"equip",10],"leche flan":[7744,"misc",1],"ledger of death":[1565,"equip",10],"ledger of death[2]":[1565,"equip",10],"legacy of dragon":[1559,"equip",10],"legion plate armor":[2341,"equip",47000],"legion plate armor[1]":[2342,"equip",51250],"leib olmai card":[4188,"misc",10],"lemon":[568,"use",30],"leopard claw":[7172,"misc",145],"leopard skin":[7171,"misc",141],"lesser elemental ring":[2680,"equip",10],"level 1 frost diver":[700,"use",500],"level 10 cookbook":[7481,"misc",500],"level 3 cold bolt":[688,"use",500],"level 3 earth spike":[686,"use",500],"level 3 fire bolt":[690,"use",500],"level 3 heal":[12001,"use",1000],"level 3 lightening bolt":[692,"use",500],"level 3 soul strike":[694,"use",500],"level 5 cold bolt":[689,"use",1000],"level 5 earth spike":[687,"use",1000],"level 5 fire ball":[697,"use",1000],"level 5 fire bolt":[691,"use",1000],"level 5 fire wall":[699,"use",1000],"level 5 frost diver":[12000,"use",1000],"level 5 heal":[12002,"use",1000],"level 5 lightening bolt":[693,"use",1000],"level 5 soul strike":[695,"use",1000],"level 6 cookbook":[7477,"misc",500],"level 7 cookbook":[7478,"misc",500],"level 8 cookbook":[7479,"misc",500],"level 9 cookbook":[7480,"misc",500],"lever action rifle":[13170,"equip",10],"lever action rifle[2]":[13170,"equip",10],"librarian glove":[2716,"equip",10],"librarian glove[1]":[2716,"equip",10],"lich's bone wand":[1624,"equip",10],"lich's bone wand[2]":[1624,"equip",10],"life link":[2391,"equip",10],"life link[1]":[2391,"equip",10],"light epsilon":[1315,"equip",0],"linen glove":[2749,"equip",10],"linen glove[1]":[2749,"equip",10],"little evil horn":[1038,"misc",264],"little evil wing":[1039,"misc",1000],"little ghost doll":[7268,"misc",605],"live coal":[7098,"misc",319],"log":[7201,"misc",125],"loki's nail":[1262,"equip",10],"loki's whispers":[7019,"misc",10],"loli ruri card":[4191,"misc",10],"loner's guitar":[1915,"equip",10],"long barrel":[13163,"equip",20000],"long barrel[1]":[13164,"equip",20000],"long horn":[1420,"equip",10],"long horn[1]":[1420,"equip",10],"long mace":[1525,"equip",10],"longinus's spear":[1469,"equip",10],"lord knight card":[4357,"misc",10],"lord of the dead card":[4276,"misc",10],"lord's clothes":[2318,"equip",10],"lord's clothes[1]":[2318,"equip",10],"love flower":[7864,"misc",10],"luciola vespa card":[4445,"misc",10],"lucius's fierce armor of volcano":[2344,"equip",68000],"lucius's fierce armor of volcano[1]":[2345,"equip",68000],"lucky candy":[570,"use",5],"lucky candy cane":[571,"use",10],"lucky cookie":[572,"use",500],"lude card":[4193,"misc",10],"luna bow":[1723,"equip",10],"luna bow[2]":[1723,"equip",10],"lunakaligo":[1544,"equip",10],"lunakaligo[3]":[1544,"equip",10],"lunatic brooch":[2718,"equip",10],"lunatic brooch[1]":[2718,"equip",10],"lunatic card":[4006,"misc",10],"lute":[1905,"equip",12250],"lute[2]":[1905,"equip",12250],"lute[3]":[1906,"equip",12250],"macapuno":[7750,"misc",1],"mace":[1504,"equip",800],"mace[3]":[1504,"equip",800],"mace[4]":[1505,"equip",800],"maero of thanatos card":[4395,"misc",10],"mage coat":[2334,"equip",10],"mage coat[1]":[2372,"equip",10],"mage hat":[5027,"equip",10],"magic bible vol1":[2131,"equip",10],"magic bible vol1[1]":[2131,"equip",10],"magician hat":[5045,"equip",10],"magma fist":[1818,"equip",10],"magma fist[3]":[1818,"equip",10],"magmaring card":[4432,"misc",10],"magni's cap":[5122,"equip",15000],"magnifier":[611,"use",20],"magnolia card":[4076,"misc",10],"main gauche":[1207,"equip",1200],"main gauche[3]":[1207,"equip",1200],"main gauche[4]":[1208,"equip",1200],"majestic goat":[2256,"equip",10],"majestic goat[1]":[5160,"equip",10],"majoruros card":[4201,"misc",10],"male thief bug card":[4050,"misc",10],"manacles":[1098,"misc",329],"mandolin":[1903,"equip",9000],"mandolin[2]":[1903,"equip",9000],"mandolin[3]":[1904,"equip",9000],"mandragora cap":[5399,"equip",10],"mandragora cap[1]":[5399,"equip",10],"mandragora card":[4030,"misc",10],"mane":[1028,"misc",98],"maneater blossom":[1032,"misc",98],"maneater root":[1033,"misc",104],"manteau":[2505,"equip",16000],"manteau[1]":[2506,"equip",16000],"mantis card":[4079,"misc",10],"mantis scythe":[1031,"misc",98],"mantle":[2307,"equip",5000],"mantle[1]":[2308,"equip",5000],"mao guai card":[4202,"misc",10],"marc card":[4105,"misc",10],"marduk card":[4112,"misc",10],"margaretha sorin card":[4364,"misc",10],"marin card":[4196,"misc",10],"marina card":[4055,"misc",10],"marine sphere card":[4084,"misc",10],"marionette card":[4113,"misc",10],"marionette doll":[5141,"equip",10],"marionette doll[1]":[5141,"equip",10],"marse card":[4095,"misc",10],"marshmallow":[7862,"misc",0],"martin card":[4046,"misc",10],"masamune":[1165,"equip",10],"masque of tutankhamen":[7114,"misc",5],"masquerade":[2291,"equip",10],"mastela fruit":[522,"use",4250],"mastering card":[4197,"misc",10],"mastersmith card":[4361,"misc",10],"matchstick":[7035,"misc",50],"matyr card":[4097,"misc",10],"matyr's leash":[2618,"equip",1],"maya card":[4146,"misc",10],"maya purple card":[4198,"misc",10],"meat":[517,"use",25],"medusa card":[4124,"misc",10],"megalith card":[4200,"misc",10],"megalodon card":[4067,"misc",10],"memento":[934,"misc",300],"memory book":[2109,"equip",10],"memory book[1]":[2121,"equip",10],"memory of thanatos card":[4399,"misc",10],"ment":[708,"misc",250],"merman card":[4199,"misc",10],"metal fragment":[7095,"misc",537],"metaling card":[4341,"misc",10],"metaller card":[4057,"misc",10],"meteo plate armor":[2364,"equip",10],"meteo plate armor[1]":[2364,"equip",10],"mi gao card":[4231,"misc",10],"mighty staff":[1613,"equip",10],"milk":[519,"use",12],"mimic card":[4205,"misc",10],"mineral card":[4339,"misc",10],"mini demon card":[4204,"misc",10],"mini propeller":[2259,"equip",10],"mink coat":[2311,"equip",10],"mink coat[1]":[2311,"equip",10],"minorous card":[4126,"misc",10],"mirror shield":[2107,"equip",30000],"mirror shield[1]":[2108,"equip",30000],"mistress card":[4132,"misc",10],"mistress of shelter card":[4393,"misc",10],"mithril magic cape":[2532,"equip",10],"mithril magic cape[1]":[2532,"equip",10],"miyabi doll card":[4208,"misc",10],"mobster card":[4317,"misc",10],"mole claw":[1018,"misc",105],"mole whiskers":[1017,"misc",53],"monk hat":[2251,"equip",15000],"monk hat[1]":[5158,"equip",15000],"monkey circlet":[10018,"equip",10],"monster juice":[626,"use",750],"monster's feed":[528,"use",30],"moonlight dagger":[1234,"equip",10],"moonlight flower card":[4131,"misc",10],"morning star":[1513,"equip",20500],"morning star[1]":[1513,"equip",20500],"morning star[2]":[1514,"equip",20500],"morpheus's bracelet":[2649,"equip",15000],"morpheus's hood":[5126,"equip",15000],"morpheus's ring":[2648,"equip",15000],"morpheus's shawl":[2518,"equip",15000],"morrigane's belt":[2650,"equip",15000],"morrigane's helm":[5127,"equip",15000],"morrigane's manteau":[2519,"equip",15000],"morrigane's pendant":[2651,"equip",15000],"moth dust":[1057,"misc",69],"moth wings":[1058,"misc",100],"mother's nightmare":[7020,"misc",10],"mould powder":[7001,"misc",233],"mr. scream":[2288,"equip",10],"mud lump":[7004,"misc",438],"muffler":[2503,"equip",2500],"muffler[1]":[2504,"equip",2500],"muka card":[4036,"misc",10],"mummy card":[4106,"misc",10],"munak card":[4090,"misc",10],"munak doll":[7277,"misc",4450],"munak hat":[2264,"equip",10],"munak hat[1]":[5167,"equip",10],"muramasa":[1164,"equip",10],"murasame":[13012,"equip",10],"murasame[1]":[13012,"equip",10],"murasame[2]":[13013,"equip",10],"muscipular card":[4420,"misc",10],"muscle cutter":[1176,"equip",10],"muscle cutter[2]":[1176,"equip",10],"muscovite":[7292,"misc",1500],"mushroom spore":[921,"misc",18],"musika":[2545,"equip",10],"musika[1]":[2545,"equip",10],"mutant dragonoid card":[4203,"misc",10],"mute arrow":[1769,"misc",5],"myst card":[4108,"misc",10],"myst case card":[4206,"misc",10],"mysteltainn":[1138,"equip",10],"mysteltainn card":[4207,"misc",10],"mystic frozen":[995,"misc",1500],"mystic horn":[6023,"misc",500],"nagan":[1130,"equip",10],"neck of demon dragon":[7607,"misc",5],"necklace":[2603,"equip",15000],"necklace of oblivion":[1008,"misc",1],"necklace of wisdom":[1007,"misc",1],"necklace[1]":[2623,"equip",15000],"necromancer card":[4440,"misc",10],"needle of alarm":[1095,"misc",273],"needle packet":[7213,"misc",416],"nemesis":[1541,"equip",10],"nepenthes bow":[1740,"equip",10],"nepenthes bow[2]":[1740,"equip",10],"nereid card":[4167,"misc",10],"new year rice cake":[6005,"misc",0],"nightmare card":[4127,"misc",10],"nightmare terror card":[4166,"misc",10],"nine tail card":[4159,"misc",10],"nine tails":[1022,"misc",325],"ninja suit":[2337,"equip",10],"ninja suit[1]":[2359,"equip",10],"nipper":[960,"misc",57],"nose ring":[941,"misc",284],"noxious card":[4334,"misc",10],"nurse cap":[2277,"equip",10],"nursing bottle":[7270,"misc",550],"nut shell":[5037,"equip",10],"nydhorgg's shadow garb":[2554,"equip",10],"nydhorgg's shadow garb[1]":[2554,"equip",10],"obeaune card":[4093,"misc",10],"obsidian card":[4338,"misc",10],"odin's blessing":[2353,"equip",15000],"odin's blessing[1]":[2353,"equip",15000],"odium of thanatos card":[4396,"misc",10],"ogre tooth":[7002,"misc",329],"ogretooth card":[4254,"misc",10],"oil paper":[7151,"misc",105],"old blue box":[603,"use",5000],"old broom":[637,"use",175],"old card album":[616,"use",5000],"old frying pan":[7031,"misc",98],"old hilt":[7022,"misc",75],"old magicbook":[1006,"misc",1],"old manteau":[7207,"misc",525],"old pick":[7318,"misc",256],"old portrait":[7014,"misc",750],"old purple box":[617,"use",5000],"old shuriken":[7072,"misc",890],"old white cloth":[7751,"misc",275],"omen of tempest":[7089,"misc",0],"opal":[727,"misc",3000],"ora ora":[701,"misc",27500],"orange":[582,"use",150],"orange gooey mushroom":[1070,"misc",1],"orange juice":[620,"use",750],"orange net mushroom":[1069,"misc",1],"orange potion":[502,"use",100],"orc archer bow":[1734,"equip",10],"orc archer card":[4256,"misc",10],"orc baby card":[4375,"misc",10],"orc claw":[1043,"misc",84],"orc helm":[2299,"equip",10],"orc helm[1]":[5157,"equip",10],"orc hero card":[4143,"misc",10],"orc lady card":[4255,"misc",10],"orc lord card":[4135,"misc",10],"orc skeleton card":[4085,"misc",10],"orc warrior card":[4066,"misc",10],"orc zombie card":[4071,"misc",10],"orc's fang":[922,"misc",110],"orcish axe":[1304,"equip",10],"orcish axe[4]":[1309,"equip",10],"orcish sword":[1124,"equip",10],"orcish voucher":[931,"misc",71],"oridecon":[984,"misc",550],"oridecon arrow":[1765,"misc",15],"oridecon arrow quiver":[12007,"use",1],"oridecon hammer":[615,"use",2500],"oriental lute":[1918,"equip",10],"oriental lute[2]":[1922,"equip",10],"orleans's glove":[2701,"equip",10],"orleans's glove[1]":[2701,"equip",10],"orleans's gown":[2365,"equip",10],"orleans's gown[1]":[2365,"equip",10],"orleans's server":[2123,"equip",10],"orleans's server[1]":[2123,"equip",10],"osiris card":[4144,"misc",10],"osiris doll":[751,"misc",7000],"outdoor cooking kit":[12125,"use",250],"owl baron card":[4238,"misc",10],"owl duke card":[4237,"misc",10],"pacifier":[10004,"equip",10],"padded armor":[2312,"equip",24000],"padded armor[1]":[2313,"equip",24000],"panacea":[525,"use",250],"panda hat":[5030,"equip",10],"pantie":[2339,"equip",500],"pantie[1]":[2371,"equip",500],"panzer goblin card":[4310,"misc",10],"parasite card":[4309,"misc",10],"partizan":[1457,"equip",13500],"partizan[1]":[1457,"equip",13500],"partizan[2]":[1458,"equip",13500],"pasana card":[4099,"misc",10],"pauldron":[2514,"equip",10],"pauldron[1]":[2514,"equip",10],"peaked hat":[6021,"misc",216],"pearl":[722,"misc",3000],"peco peco card":[4031,"misc",10],"peco peco egg card":[4007,"misc",10],"peco peco feather":[7101,"misc",227],"peeps":[7860,"misc",0],"pellet":[7226,"misc",1],"penomena card":[4314,"misc",10],"peridot":[7289,"misc",1500],"permeter card":[4311,"misc",10],"pest card":[4315,"misc",10],"pet food":[537,"use",500],"pet incubator":[643,"use",1500],"ph.d hat":[5012,"equip",10],"ph.d hat[1]":[5347,"equip",10],"pharaoh card":[4148,"misc",10],"phen card":[4077,"misc",10],"phendark card":[4329,"misc",10],"phlogopite":[7290,"misc",1500],"phracon":[1010,"misc",100],"phreeoni card":[4121,"misc",10],"picky card":[4008,"misc",10],"picky egg card":[4011,"misc",10],"piece of bamboo":[7150,"misc",155],"piece of black cloth":[7205,"misc",263],"piece of cake":[539,"use",1500],"piece of cogwheel":[7703,"misc",1],"piece of egg shell":[7032,"misc",84],"piece of shield":[7108,"misc",840],"piercing staff":[1626,"equip",10],"pike":[1407,"equip",1725],"pike[3]":[1407,"equip",1725],"pike[4]":[1408,"equip",1725],"pinafore":[7269,"misc",480],"pincher of beetle":[7202,"misc",145],"pinguicula corsage":[2745,"equip",10],"pinguicula corsage[1]":[2745,"equip",10],"pipe":[2268,"equip",10],"pirate bandana":[2287,"equip",10],"pirate bandana[1]":[5350,"equip",10],"pirate skeleton card":[4073,"misc",10],"pitman card":[4335,"misc",10],"plankton card":[4024,"misc",10],"plasma card":[4389,"misc",10],"platinum shield":[2122,"equip",10],"platinum shotel":[13404,"equip",10],"platinum shotel[1]":[13404,"equip",10],"pocket watch":[2717,"equip",10],"pointed scale":[906,"misc",34],"poison arrow":[1763,"misc",5],"poison bottle":[678,"use",2500],"poison knife":[1239,"equip",10],"poison knife[2]":[13016,"equip",10],"poison spore":[7033,"misc",57],"poison spore card":[4048,"misc",10],"poisonous powder":[7154,"misc",80],"poisonous toad card":[4175,"misc",10],"poisonous toad skin":[7155,"misc",140],"poker face":[5087,"equip",10],"pole axe":[1417,"equip",10],"pole axe[1]":[1417,"equip",10],"poo poo hat":[2289,"equip",10],"pope cookie":[12379,"use",5],"poporing card":[4033,"misc",10],"porcellio card":[4337,"misc",10],"porcupine quill":[1027,"misc",79],"poring card":[4001,"misc",10],"poring doll":[741,"misc",900],"poring hat":[5035,"equip",10],"potato":[516,"use",7],"powder of butterfly":[924,"misc",45],"prickly fruit":[576,"use",270],"principles of magic":[1572,"equip",10],"principles of magic[2]":[1572,"equip",10],"professional cooking kit":[12127,"use",1000],"pumpkin":[535,"use",7],"pumpkin lantern":[7225,"misc",243],"pumpkin mojo":[7609,"misc",0],"pumpkin-head":[5134,"equip",10],"punisher":[10008,"equip",10],"punk card":[4313,"misc",10],"pupa card":[4003,"misc",10],"puppet":[740,"misc",500],"puppy headband":[5118,"equip",10],"puppy love":[5008,"equip",10],"pyroxene":[7296,"misc",1500],"quadrille":[1527,"equip",10],"queen's hair ornament":[10006,"equip",10],"queen's whip":[1970,"equip",10],"queen's whip[2]":[1976,"equip",10],"quve card":[4294,"misc",10],"raccoon doll":[754,"misc",2500],"raccoon leaf":[945,"misc",53],"rafflesia card":[4083,"misc",10],"ragamuffin manteau":[2508,"equip",28000],"ragged zombie card":[4436,"misc",10],"raggler card":[4186,"misc",10],"rainbow carrot":[622,"use",1250],"rainbow shell":[1013,"misc",45],"randgris card":[4407,"misc",10],"rante whip":[1956,"equip",16000],"rante whip[1]":[1957,"equip",16000],"rapier":[1110,"equip",5000],"rapier[2]":[1110,"equip",5000],"rapier[3]":[1111,"equip",5000],"rat tail":[1016,"misc",26],"raydric archer card":[4187,"misc",10],"raydric card":[4133,"misc",10],"red bandana":[2275,"equip",10],"red bijou":[7447,"misc",443],"red blood":[990,"misc",500],"red chile":[7286,"misc",10],"red envelope":[668,"use",0],"red feather":[7440,"misc",667],"red ferus card":[4380,"misc",10],"red flame whip":[1965,"equip",10],"red frame":[734,"misc",1500],"red gemstone":[716,"misc",300],"red herb":[507,"use",9],"red jewel":[7575,"misc",10],"red muffler":[7216,"misc",330],"red novus card":[4383,"misc",10],"red prickly fruit":[587,"use",440],"red scarf":[10019,"equip",10],"red silk seal":[2700,"equip",10],"red square bag":[16001,"equip",10],"red square bag[2]":[16001,"equip",10],"red stocking":[7034,"misc",50],"refined bradium":[6090,"misc",550],"reins":[1064,"misc",401],"release of wish":[1630,"equip",10],"remover card":[4353,"misc",10],"reptile tongue":[903,"misc",70],"requiem card":[4104,"misc",10],"research chart":[7347,"misc",420],"resin":[907,"misc",60],"ribbon":[2208,"equip",400],"ribbon[1]":[2209,"equip",400],"rice ball":[564,"use",0],"rice ball doll":[7272,"misc",250],"rice cake":[550,"use",5],"rider insignia":[2529,"equip",10],"rider insignia[1]":[2530,"equip",10],"rideword card":[4185,"misc",10],"ring":[2601,"equip",15000],"ring of flame lord":[2678,"equip",10],"ring of resonance":[2679,"equip",10],"ring pommel saber":[1122,"equip",12000],"ring pommel saber[2]":[1122,"equip",12000],"ring pommel saber[3]":[1125,"equip",12000],"ring[1]":[2621,"equip",15000],"ripple":[7090,"misc",0],"robe of cast":[2343,"equip",62400],"robe of cast[1]":[2360,"equip",62400],"rocker card":[4021,"misc",10],"rocker doll":[752,"misc",2000],"rod":[1601,"equip",25],"rod[3]":[1601,"equip",25],"rod[4]":[1602,"equip",25],"roda frog card":[4014,"misc",10],"rogue's treasure":[2620,"equip",5000],"romantic flower":[2269,"equip",10],"romantic gent":[2247,"equip",7500],"romantic leaf":[2270,"equip",10],"root of stone":[7082,"misc",0],"rope":[1950,"equip",1250],"rope[3]":[1950,"equip",1250],"rope[4]":[1951,"equip",1250],"rosary":[2608,"equip",7500],"rosary[1]":[2626,"equip",7500],"rose quartz":[7293,"misc",1500],"rotar zairo card":[4192,"misc",10],"rotten bandage":[930,"misc",175],"rotten fish":[624,"use",1250],"rotten meat":[7564,"misc",51],"rouge":[739,"misc",5000],"rough elunium":[757,"misc",325],"rough oridecon":[756,"misc",275],"rough wind":[996,"misc",1500],"round shell":[1096,"misc",390],"roween card":[4422,"misc",10],"royal cooking kit":[12128,"use",2500],"royal jelly":[526,"use",3500],"rsx-0806 card":[4342,"misc",10],"ruber":[13421,"equip",10],"ruber[1]":[13421,"equip",10],"ruby":[723,"misc",3000],"rudra bow":[1720,"equip",10],"rune of darkness":[7511,"misc",1263],"rusty iron":[625,"use",50],"rusty kitchen knife":[7208,"misc",890],"rusty screw":[7317,"misc",267],"rybio card":[4194,"misc",10],"sabbath":[1365,"equip",10],"saber":[1126,"equip",24500],"saber[2]":[1126,"equip",24500],"saber[3]":[1127,"equip",24500],"sacred mission":[2111,"equip",64000],"sacred mission[1]":[2128,"equip",64000],"safety helmet":[5009,"equip",10],"safety ring":[2615,"equip",37500],"sage worm card":[4219,"misc",10],"sage's diary":[1560,"equip",10],"sage's diary[2]":[1560,"equip",10],"sago":[7746,"misc",1],"saint's robe":[2325,"equip",27000],"saint's robe[1]":[2326,"equip",27000],"salamander card":[4429,"misc",10],"samurai spector card":[4263,"misc",10],"sand clump":[7124,"misc",353],"sandals":[2401,"equip",200],"sandals[1]":[2402,"equip",200],"sandman card":[4101,"misc",10],"sandstorm":[13035,"equip",10],"sandstorm[4]":[13035,"equip",10],"santa hat":[2236,"equip",10],"santa poring card":[4005,"misc",10],"saphien's armor of ocean":[2346,"equip",68000],"saphien's armor of ocean[1]":[2347,"equip",68000],"sapphire":[726,"misc",3000],"sardonyx":[725,"misc",3000],"sashimi":[1144,"equip",10],"sasquatch card":[4216,"misc",10],"savage babe card":[4017,"misc",10],"savage card":[4078,"misc",10],"scale shell":[936,"misc",233],"scalpel":[13027,"equip",10],"scalpel[3]":[13027,"equip",10],"scapulare":[2323,"equip",3250],"scapulare[1]":[2324,"equip",3250],"scell":[911,"misc",80],"schweizersabel":[1167,"equip",10],"schweizersabel[2]":[1178,"equip",10],"scimitar":[1113,"equip",8500],"scimitar[2]":[1113,"equip",8500],"scimitar[3]":[1114,"equip",8500],"scorpion card":[4068,"misc",10],"scorpion claw":[7125,"misc",353],"scorpion tail":[904,"misc",62],"sea witch's foot":[1973,"equip",10],"sea witch's foot[1]":[1973,"equip",10],"sea-otter card":[4326,"misc",10],"sea-otter fur":[7065,"misc",410],"seal card":[4312,"misc",10],"seeker card":[4414,"misc",10],"seismic fist":[1821,"equip",10],"seismic fist[3]":[1821,"equip",10],"seyren windsor card":[4358,"misc",10],"shackles":[2408,"equip",2500],"shadow guard":[2135,"equip",10],"shadow guard[1]":[2135,"equip",10],"shadow walk":[2426,"equip",10],"sharp arrow":[1764,"misc",10],"sharp leaf":[7100,"misc",403],"sharp paper":[7112,"misc",453],"sharp scale":[963,"misc",125],"sharpened legbone of ghoul":[1260,"equip",26250],"shell":[935,"misc",7],"shell fish card":[4273,"misc",10],"shield":[2105,"equip",28000],"shield of naga":[2134,"equip",10],"shield of naga[1]":[2134,"equip",10],"shield[1]":[2106,"equip",28000],"shining scale":[954,"misc",233],"shining spear blade":[7109,"misc",420],"shining stone":[640,"use",1500],"shinobi card":[4230,"misc",10],"shinobi sash":[2654,"equip",10000],"shoes":[2403,"equip",1750],"shoes[1]":[2404,"equip",1750],"shoot":[711,"misc",8],"short daenggie":[1094,"misc",139],"shoulder protector":[7196,"misc",115],"shrimp":[567,"use",250],"sidewinder card":[4117,"misc",10],"silk ribbon":[10007,"equip",10],"silk robe":[2321,"equip",4000],"silk robe[1]":[2322,"equip",4000],"silver knife of chastity":[638,"use",6000],"silver ornament":[7077,"misc",0],"silver ring":[2611,"equip",10000],"silver robe":[2332,"equip",3500],"silver robe[1]":[2333,"equip",3500],"sinew of bear":[7085,"misc",0],"singing flower":[629,"use",150],"singing plant":[707,"misc",250],"single cell":[1052,"misc",23],"siroma card":[4416,"misc",10],"six shooter":[13100,"equip",2250],"six shooter[1]":[13100,"equip",2250],"six shooter[2]":[13101,"equip",2250],"skeggiold card":[4406,"misc",10],"skel-bone":[932,"misc",116],"skeletal armor piece":[7450,"misc",1025],"skeleton card":[4025,"misc",10],"skeleton general card":[4221,"misc",10],"skeleton prisoner card":[4222,"misc",10],"skeleton worker card":[4092,"misc",10],"skin of ventus":[2536,"equip",10],"skin of ventus[1]":[2536,"equip",10],"skipping rope":[1968,"equip",10],"skirt of virgin":[1049,"misc",850],"skogul card":[4404,"misc",10],"skull":[7005,"misc",522],"skull ring":[2609,"equip",5000],"skull ring[1]":[2715,"equip",5000],"sky deleter card":[4158,"misc",10],"sky petite card":[4120,"misc",10],"slayer":[1151,"equip",7500],"slayer[2]":[1151,"equip",7500],"slayer[3]":[1152,"equip",7500],"sleeper card":[4228,"misc",10],"slick paper":[7111,"misc",353],"slingshot":[7195,"misc",105],"slow potion":[12017,"use",1],"small bottle":[12353,"use",400],"small ribbons":[5085,"equip",10],"small rice cake dough":[7613,"misc",0],"smasher":[1507,"equip",4500],"smasher[2]":[1507,"equip",4500],"smasher[3]":[1508,"equip",4500],"smokie card":[4044,"misc",10],"snail's shell":[946,"misc",32],"snake card":[4037,"misc",10],"snake scale":[926,"misc",41],"sniper card":[4367,"misc",10],"sniping suit":[2367,"equip",10],"sniping suit[1]":[2367,"equip",10],"snow crystal":[7088,"misc",0],"snowier card":[4415,"misc",10],"soft apron":[661,"use",10000],"soft blade of grass":[7194,"misc",200],"soft feather":[7063,"misc",140],"soft silk":[7166,"misc",600],"sohee card":[4100,"misc",10],"solar sword":[1136,"equip",10],"soldier skeleton card":[4086,"misc",10],"solid husk":[7190,"misc",70],"solid iron piece":[7507,"misc",421],"solid peach":[7164,"misc",200],"solid shell":[943,"misc",224],"solid trunk":[1067,"misc",1],"solider card":[4220,"misc",10],"soul":[7701,"misc",1],"soul crystal":[7849,"misc",0],"soul staff":[1472,"equip",10],"spawn":[908,"misc",70],"spear":[1404,"equip",850],"spear[3]":[1404,"equip",850],"spear[4]":[1405,"equip",850],"special gold":[7863,"misc",10],"specialty jur":[1264,"equip",10],"specialty jur[4]":[1264,"equip",10],"spectral spear":[1477,"equip",10],"spectral spear[1]":[1479,"equip",10],"speed potion":[12016,"use",1],"sphinx hat":[5053,"equip",10],"sphinx hat[1]":[5166,"equip",10],"spike":[1523,"equip",10],"spike[2]":[1538,"equip",10],"spiky band":[2258,"equip",10],"spiky band[1]":[5161,"equip",10],"spirit of fish":[7083,"misc",0],"spiritual crystal":[6087,"misc",525],"spiritual ring":[2677,"equip",10],"spool":[7217,"misc",212],"spoon stub":[7016,"misc",1250],"spore card":[4022,"misc",10],"spore doll":[743,"misc",2750],"spring rabbit card":[4227,"misc",10],"sprint mail":[2387,"equip",10],"sprint mail[1]":[2387,"equip",10],"sprint ring":[2744,"equip",10],"sprint shoes":[2440,"equip",10],"sprint shoes[1]":[2440,"equip",10],"sprout":[7193,"misc",115],"sputum of bird":[7084,"misc",0],"squid ink":[1024,"misc",132],"staff":[1607,"equip",4750],"staff of bordeaux":[1648,"equip",10],"staff of destruction":[2000,"equip",10],"staff of destruction[1]":[2000,"equip",10],"staff[2]":[1607,"equip",4750],"staff[3]":[1608,"equip",4750],"stainer card":[4039,"misc",10],"stalactic golem card":[4223,"misc",10],"stapo card":[4424,"misc",10],"star crumb":[1000,"misc",2250],"star dust":[1001,"misc",750],"star dust blade":[1148,"equip",10],"star dust blade[1]":[1148,"equip",10],"steamed alligator with vegetable":[12087,"use",20000],"steamed desert scorpions":[12090,"use",50000],"steel":[999,"misc",500],"steel arrow":[1753,"misc",2],"steel arrow quiver":[12006,"use",1],"steel chonchon card":[4042,"misc",10],"stellar":[2294,"equip",10],"stem":[905,"misc",23],"stem of nepenthes":[1979,"equip",10],"stem of nepenthes[2]":[1979,"equip",10],"stem worm card":[4224,"misc",10],"sticky mucus":[938,"misc",35],"sticky poison":[7565,"misc",175],"sticky webfoot":[918,"misc",10],"stiff horn":[7008,"misc",318],"stiletto":[1216,"equip",9750],"stiletto[2]":[1216,"equip",9750],"stiletto[3]":[1217,"equip",9750],"sting card":[4226,"misc",10],"stinky scale":[959,"misc",84],"stone":[7049,"misc",0],"stone arrow":[1756,"misc",1],"stone buckler":[2114,"equip",15000],"stone buckler[1]":[2114,"equip",15000],"stone fragment":[6078,"misc",0],"stone heart":[953,"misc",92],"stone of sage":[7224,"misc",0],"stone shooter card":[4225,"misc",10],"stop post":[2272,"equip",10],"stormy knight card":[4318,"misc",10],"strange steel piece":[7167,"misc",215],"straw basket":[7299,"misc",316],"straw rice bag":[7303,"misc",0],"strawberry":[578,"use",100],"striped sock":[7219,"misc",460],"strong branch":[7203,"misc",95],"strong shield":[2125,"equip",10],"strong shield[1]":[2125,"equip",10],"strong vine":[6041,"misc",15],"strouf card":[4111,"misc",10],"studded knuckles":[1805,"equip",16000],"studded knuckles[2]":[1805,"equip",16000],"studded knuckles[3]":[1806,"equip",16000],"succubus card":[4218,"misc",10],"succubus horn":[5066,"equip",10],"sucsamad":[1236,"equip",10],"sucsamad[1]":[13018,"equip",10],"sunflower":[2253,"equip",10],"sunflower[1]":[5351,"equip",10],"sunglasses":[2201,"equip",2500],"sunglasses[1]":[2202,"equip",2500],"super novice hat":[5112,"equip",4250],"super novice hat[1]":[5119,"equip",4250],"surprised mask":[5088,"equip",10],"survivor's manteau":[2509,"equip",10000],"survivor's rod":[1617,"equip",42500],"survivor's rod[1]":[1618,"equip",42500],"suspicious hat":[7567,"misc",645],"sweet bananas":[7749,"misc",1],"sweet beans":[7748,"misc",1],"sweet gent":[2245,"equip",7500],"sweet milk":[627,"use",3500],"sweet potato":[633,"use",10],"sword guardian card":[4427,"misc",10],"sword mace":[1516,"equip",25000],"sword mace[1]":[1517,"equip",25000],"swordfish card":[4089,"misc",10],"symbol of a brave warrior":[7484,"misc",0],"tablet":[1552,"equip",25500],"tablet[1]":[1552,"equip",25500],"tae goo lyeon":[1181,"equip",10],"tae goo lyeon[2]":[1181,"equip",10],"tail of steel scorpion":[7010,"misc",274],"talon":[917,"misc",10],"talon of griffon":[7048,"misc",2709],"tamruan card":[4304,"misc",10],"tangled chains":[7221,"misc",370],"tantan noodle":[12395,"use",10],"tao gunka card":[4302,"misc",10],"tarou card":[4028,"misc",10],"tassel":[7301,"misc",399],"tatacho card":[4442,"misc",10],"tattered clothes":[7071,"misc",640],"teddy bear card":[4340,"misc",10],"tendon":[1050,"misc",110],"tengu card":[4282,"misc",10],"tengu nose":[7159,"misc",200],"tentacle":[962,"misc",35],"thara frog card":[4058,"misc",10],"the paper card":[4172,"misc",10],"thief bug card":[4016,"misc",10],"thief bug egg card":[4012,"misc",10],"thief clothes":[2335,"equip",37000],"thief clothes[1]":[2336,"equip",37000],"thin trunk":[7186,"misc",190],"thor's gauntlets":[7074,"misc",0],"thorn staff of darkness":[1636,"equip",10],"thorny buckler":[2124,"equip",10],"thorny buckler[1]":[2124,"equip",10],"three-headed dragon's head":[7443,"misc",478],"thunder p":[13168,"equip",38000],"thunder p[1]":[13168,"equip",38000],"thunder p[2]":[13169,"equip",38000],"tiara":[2234,"equip",10],"tiara[1]":[5164,"equip",10],"tidal shoes":[2424,"equip",10],"tidal shoes[1]":[2424,"equip",10],"tiger panty":[7267,"misc",149],"tiger skin":[1029,"misc",274],"tiger's footskin":[1030,"misc",750],"tights":[2330,"equip",35500],"tights[1]":[2331,"equip",35500],"tiny egg shell":[10012,"equip",10],"toad card":[4306,"misc",10],"tomahawk":[1314,"equip",1],"tongue":[1015,"misc",264],"tooth blade":[13028,"equip",10],"tooth blade[1]":[13028,"equip",10],"tooth of bat":[913,"misc",17],"topaz":[728,"misc",3000],"torn magic book":[7117,"misc",571],"torn scroll":[7118,"misc",680],"tough scalelike stem":[7012,"misc",206],"tough vines":[7197,"misc",250],"tournament shield":[2133,"equip",10],"tournament shield[1]":[2133,"equip",10],"tower keeper card":[4229,"misc",10],"town sword":[1146,"equip",21000],"town sword[1]":[1146,"equip",21000],"town sword[2]":[1147,"equip",21000],"toxic gas":[7322,"misc",333],"transparent celestial robe":[7165,"misc",325],"transparent head protector":[10003,"equip",10],"transparent plate":[7352,"misc",10],"trap":[1065,"misc",50],"treasure box":[7444,"misc",150000],"tree root":[902,"misc",6],"tri joint card":[4308,"misc",10],"trident":[1460,"equip",25500],"trident[2]":[1460,"equip",25500],"trident[3]":[1461,"equip",25500],"tropical banana":[634,"use",10],"trunk":[1019,"misc",30],"tsurugi":[1119,"equip",25500],"tsurugi[1]":[1119,"equip",25500],"tsurugi[2]":[1120,"equip",25500],"turquoise":[7294,"misc",1500],"turtle general card":[4305,"misc",10],"turtle shell":[967,"misc",340],"twin edge of naght sieger":[13412,"equip",10],"twin edge of naght sieger[3]":[13412,"equip",10],"two-handed axe":[1360,"equip",27500],"two-handed axe[1]":[1360,"equip",27500],"two-handed axe[2]":[1361,"equip",27500],"two-handed sword":[1157,"equip",30000],"two-handed sword[1]":[1157,"equip",30000],"two-handed sword[2]":[1158,"equip",30000],"ube jam":[7745,"misc",1],"ulfhedinn":[2531,"equip",10],"ulfhedinn[1]":[2531,"equip",10],"ulle's cap":[5123,"equip",15000],"ulle's cap[1]":[5123,"equip",15000],"undershirt":[2522,"equip",10000],"undershirt[1]":[2523,"equip",10000],"ungoliant card":[4336,"misc",10],"unholy touch":[1263,"equip",10],"unicorn horn":[2257,"equip",10],"union of tribe":[658,"use",1],"unripe acorn":[12346,"use",0],"unripe apple":[619,"use",500],"used iron plate":[7319,"misc",512],"vadon card":[4049,"misc",10],"vagabond wolf card":[4183,"misc",10],"valhalla's flower":[7510,"misc",100000],"vali's manteau":[2517,"equip",15000],"valkyrian armor":[2357,"equip",0],"valkyrian armor[1]":[2357,"equip",0],"valkyrian manteau":[2524,"equip",0],"valkyrian manteau[1]":[2524,"equip",0],"valkyrian shoes":[2421,"equip",0],"valkyrian shoes[1]":[2421,"equip",0],"valkyrie's token":[7831,"misc",0],"valkyrja's shield":[2115,"equip",15000],"valkyrja's shield[1]":[2115,"equip",15000],"vanberk card":[4411,"misc",10],"vane":[7192,"misc",80],"variant shoes":[2423,"equip",10],"vecer axe":[1311,"equip",10],"vecer axe[2]":[1311,"equip",10],"venatu card":[4369,"misc",10],"venom canine":[937,"misc",74],"venomous card":[4333,"misc",10],"verit card":[4107,"misc",10],"vesper card":[4374,"misc",10],"vesper core 01":[2659,"equip",10],"vesper core 02":[2660,"equip",10],"vesper core 03":[2661,"equip",10],"vesper core 04":[2662,"equip",10],"veteran axe":[1384,"equip",5000],"veteran axe[2]":[1384,"equip",5000],"veteran hammer":[1548,"equip",5000],"veteran hammer[2]":[1548,"equip",5000],"veteran sword":[1188,"equip",5000],"veteran sword[1]":[1188,"equip",5000],"vidar's boots":[2418,"equip",15000],"violin":[1901,"equip",2000],"violin[3]":[1901,"equip",2000],"violin[4]":[1902,"equip",2000],"violy card":[4209,"misc",10],"vital tree shoes":[2450,"equip",10],"vitata card":[4053,"misc",10],"vocal card":[4211,"misc",10],"waghnak":[1801,"equip",4000],"waghnak[3]":[1801,"equip",4000],"waghnak[4]":[1802,"equip",4000],"wand":[1604,"equip",1250],"wand of occult":[1614,"equip",10],"wand[2]":[1604,"equip",1250],"wand[3]":[1605,"equip",1250],"wanderer card":[4210,"misc",10],"war axe":[1306,"equip",10],"war axe[1]":[1306,"equip",10],"waste stove card":[4332,"misc",10],"wasteland's outlaw":[13107,"equip",10],"wasteland's outlaw[2]":[13107,"equip",10],"wedding dress":[2338,"equip",21500],"wedding veil":[2206,"equip",11500],"weihna":[13047,"equip",10],"weihna[2]":[13047,"equip",10],"well-baked cookie":[538,"use",500],"well-dried bone":[628,"use",5000],"western grace":[2248,"equip",7500],"wheel of the unknown":[7076,"misc",0],"whip of balance":[1980,"equip",10],"whip of balance[3]":[1980,"equip",10],"whisper card":[4102,"misc",10],"white chocolate":[561,"use",2500],"white herb":[509,"use",60],"white lady card":[4372,"misc",10],"white mask":[7568,"misc",530],"white potion":[504,"use",600],"wickebine tres card":[4348,"misc",10],"wig":[10005,"equip",10],"wild beast claw":[1268,"equip",10],"wild beast claw[1]":[1268,"equip",10],"wild rose card":[4257,"misc",10],"will of red darkness":[7566,"misc",765],"will of the darkness":[7340,"misc",367],"willow card":[4010,"misc",10],"wind general":[7486,"misc",0],"wind ghost card":[4264,"misc",10],"wind of verdure":[992,"misc",500],"windhawk":[1307,"equip",9000],"wing of dragonfly":[7064,"misc",260],"wing of red bat":[7006,"misc",84],"wing staff":[1616,"equip",10],"witched starsand":[1061,"misc",242],"withered flower":[6086,"misc",445],"witherless rose":[748,"misc",27500],"wizard hat":[2252,"equip",10],"wizardry staff":[1473,"equip",10],"wolf card":[4029,"misc",10],"wolf claw":[920,"misc",29],"woman's moustache":[7081,"misc",0],"wooden block":[7850,"misc",10],"wooden gnarl":[7222,"misc",234],"wooden golem card":[4259,"misc",10],"wooden heart":[7189,"misc",340],"wooden mail":[2328,"equip",2750],"wooden mail[1]":[2329,"equip",2750],"wool scarf":[2528,"equip",10],"wool scarf[1]":[2528,"equip",10],"wootan fighter card":[4261,"misc",10],"wootan shooter card":[4260,"misc",10],"worm peeling":[955,"misc",26],"wormtail card":[4034,"misc",10],"worn out page":[1097,"misc",474],"worn out scroll":[618,"use",25],"worn-out kimono":[7153,"misc",295],"worn-out magic scroll":[7099,"misc",386],"worn-out prison uniform":[1099,"misc",340],"wraith card":[4190,"misc",10],"wraith dead card":[4189,"misc",10],"wrapping lace":[7174,"misc",0],"wrapping paper":[7175,"misc",0],"wrath of valkyrie":[7078,"misc",0],"wrench":[1531,"equip",10],"yaga's pestle":[7762,"misc",10],"yam":[549,"use",90],"yao jun card":[4328,"misc",10],"yarn":[7038,"misc",50],"yellow bijou":[7448,"misc",443],"yellow gemstone":[715,"misc",300],"yellow herb":[508,"use",20],"yellow jewel":[7577,"misc",10],"yellow novus card":[4382,"misc",10],"yellow plate":[7149,"misc",110],"yggdrasil berry":[607,"use",2500],"yggdrasil leaf":[610,"use",2000],"yggdrasil seed":[608,"use",2500],"young twig":[7018,"misc",25],"yoyo card":[4051,"misc",10],"yoyo doll":[753,"misc",3000],"yoyo tail":[942,"misc",57],"zargon":[912,"misc",240],"zealotus card":[4277,"misc",10],"zenorc card":[4096,"misc",10],"zenorc's fang":[1044,"misc",132],"zeny knife":[1238,"equip",10],"zephyrus":[1468,"equip",10],"zephyrus[3]":[1481,"equip",10],"zerom card":[4064,"misc",10],"zhu po long card":[4272,"misc",10],"zipper bear card":[4281,"misc",10],"zircon":[729,"misc",3000],"zombie card":[4038,"misc",10],"zombie master card":[4274,"misc",10],"zombie prisoner card":[4275,"misc",10],"zombie slaughter card":[4435,"misc",10],"zorro masque":[2263,"equip",10],"zweihander":[1168,"equip",10],"zweihander[2]":[1171,"equip",10]};

function fmtTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function fmtZeny(n) {
  return Math.round(n || 0).toLocaleString("en-US");
}

// Typo-tolerant matching: exact substring wins (scored by how early it
// appears), then falls back to a subsequence match (query's characters
// appear in order, not necessarily adjacent) so small typos or skipped
// letters still find things. Returns -1 for no match at all.
function fuzzyScore(query, target) {
  const q = (query || "").trim().toLowerCase();
  const t = (target || "").toLowerCase();
  if (!q) return 0;
  const idx = t.indexOf(q);
  if (idx !== -1) return 1000 - idx;
  let ti = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const found = t.indexOf(q[qi], ti);
    if (found === -1) return -1;
    ti = found + 1;
  }
  return 1;
}

function fuzzyMatch(query, target) {
  return fuzzyScore(query, target) >= 0;
}

function fmtDateTime(ts) {
  const d = new Date(ts);
  const datePart = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  return `${datePart} ${hours}:${minutes}${ampm}`;
}

function msToHMS(ms) {
  const totalSec = Math.floor((ms || 0) / 1000);
  return {
    h: Math.floor(totalSec / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  };
}

function hmsToMs(h, m, s) {
  return ((h || 0) * 3600 + (m || 0) * 60 + (s || 0)) * 1000;
}

function historyMainGross(entry) {
  return (entry.items || []).reduce((sum, it) => sum + (it.qty || 0) * (it.sell || 0), 0);
}

function historyExtraGross(entry) {
  return (entry.extraItems || []).reduce((sum, it) => sum + (it.qty || 0) * (it.sell || 0), 0);
}

function historyCostsTotal(entry) {
  return (entry.costs || []).reduce((sum, it) => sum + (it.qty || 0) * (it.sell || 0), 0);
}

// The "official" total used for zeny/hour and the primary figure shown for
// a session — Main minus Costs. Extras are tracked separately since they
// don't drop consistently and would otherwise skew the rate.
function historyTotal(entry) {
  return historyMainGross(entry) - historyCostsTotal(entry);
}

// Everything actually earned that session, Extras included — shown as a
// secondary/reference figure, never used for the rate.
function historyCombinedTotal(entry) {
  return historyMainGross(entry) + historyExtraGross(entry) - historyCostsTotal(entry);
}

function historyZenyPerHour(entry) {
  const total = historyTotal(entry);
  const hrs = (entry.durationMs || 0) / 3600000;
  return hrs > 0.0005 ? total / hrs : 0;
}

// Older saved sessions stored only aggregate total/itemCount instead of a full
// items array, and combined Main+Extras into one `items` list. Convert those
// into a single editable line (or default an empty `extraItems`) so old
// history doesn't break the (now Main/Extra-split) editor. Old combined
// totals are treated as all-Main, since we can't retroactively separate them.
function migrateHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory.map((h) => {
    const withCosts = Array.isArray(h.costs) ? h : { ...h, costs: [] };
    const withExtras = Array.isArray(withCosts.extraItems) ? withCosts : { ...withCosts, extraItems: [] };
    if (Array.isArray(withExtras.items)) return withExtras;
    const legacyTotal = typeof withExtras.total === "number" ? withExtras.total : 0;
    return {
      ...withExtras,
      items:
        legacyTotal > 0
          ? [{ id: uid(), name: "Farmed items (from earlier session)", qty: 1, sell: legacyTotal }]
          : [],
    };
  });
}

// Parses lines like "Blue Potion   3720" or "Blue Potion,3720" into {name, sell}
function parseBulkItems(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cleaned = line.replace(/\t/g, "  ");
      const match = cleaned.match(/^(.*\S)[\s,]+([\d,]+)\s*$/);
      if (!match) return null;
      const name = match[1].trim();
      const sell = parseInt(match[2].replace(/,/g, ""), 10);
      if (!name || !sell || isNaN(sell)) return null;
      return { name, sell };
    })
    .filter(Boolean);
}

function mapItemsToText(items) {
  return items.map((it) => `${it.name}\t${it.sell}`).join("\n");
}

let uidCounter = 0;
function uid() {
  uidCounter += 1;
  return `${Date.now()}-${uidCounter}`;
}

export default function ZenyFarmTracker({ initialBackup }) {
  const [items, setItems] = useState([]);
  const [extraItems, setExtraItems] = useState([]);
  const [costItems, setCostItems] = useState([]);
  const [activeListTab, setActiveListTab] = useState("main");
  const [nameSortDir, setNameSortDir] = useState(null);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [accumulated, setAccumulated] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [combineSelectedIds, setCombineSelectedIds] = useState([]);
  const [undoDeleted, setUndoDeleted] = useState(null); // { entry, index } | null
  const undoTimerRef = useRef(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState("all"); // "all" | "today" | "7d" | "30d"
  const [historyPageSize, setHistoryPageSize] = useState("10");
  const [historyPage, setHistoryPage] = useState(1);
  const [bulkSelectedIds, setBulkSelectedIds] = useState([]);
  const [chartMetric, setChartMetric] = useState("zeny"); // "zeny" | "time"
  const [chartSplitByMap, setChartSplitByMap] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [mapUpdateFlash, setMapUpdateFlash] = useState(false);
  const [storageOk, setStorageOk] = useState(null); // null = checking, true = working, false = failed

  const [maps, setMaps] = useState([]);
  const [laps, setLaps] = useState([]);
  const [activeMapId, setActiveMapId] = useState(null);
  const [mapForm, setMapForm] = useState(null); // { mode: 'new' | 'edit', id, name, text }
  const [defaultItems, setDefaultItems] = useState({ items: [], extraItems: [] });
  const [defaultItemsForm, setDefaultItemsForm] = useState(null); // { text, extraText } while editing

  const [monsters, setMonsters] = useState([]);
  const [customItems, setCustomItems] = useState([]);
  const [monsterQuery, setMonsterQuery] = useState("");
  const [monsterDropdownOpen, setMonsterDropdownOpen] = useState(false);
  const [itemQuery, setItemQuery] = useState("");
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
  const [defaultItemQuery, setDefaultItemQuery] = useState("");
  const [defaultItemDropdownOpen, setDefaultItemDropdownOpen] = useState(false);
  const [monsterForm, setMonsterForm] = useState(null); // { mode: 'new' | 'edit', id, name, text }

  const tickRef = useRef(null);
  const qtyInputRefs = useRef([]);

  // On first use in a browser, seed the bundled export so the supplied
  // history and maps are ready immediately. Existing browser data wins.
  useEffect(() => {
    if (!initialBackup || !window.localStorage) return;
    const seeds = {
      [SESSION_KEY]: initialBackup.session,
      [HISTORY_KEY]: initialBackup.history,
      [MAPS_KEY]: initialBackup.maps,
      [DEFAULT_ITEMS_KEY]: initialBackup.defaultItems,
      [MONSTERS_KEY]: initialBackup.monsters,
      [CUSTOM_ITEMS_KEY]: initialBackup.customItems,
    };
    Object.entries(seeds).forEach(([key, value]) => {
      if (value !== undefined && window.localStorage.getItem(key) === null) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    });
  }, [initialBackup]);

  // Load persisted state
  useEffect(() => {
    (async () => {
      // Health check: persistent storage silently no-ops on unpublished
      // artifacts (no thrown error, no console warning), so the only way to
      // know it's actually working is to round-trip a real write/read.
      try {
        const probe = String(Date.now());
        await window.storage.set(STORAGE_HEALTH_KEY, probe, false);
        const readBack = await window.storage.get(STORAGE_HEALTH_KEY);
        setStorageOk(!!readBack && readBack.value === probe);
      } catch (e) {
        setStorageOk(false);
      }
      try {
        const s = await window.storage.get(SESSION_KEY);
        if (s && s.value) {
          const parsed = JSON.parse(s.value);
          setItems(parsed.items || []);
          setExtraItems(parsed.extraItems || []);
          setCostItems(parsed.costItems || []);
          setActiveListTab(parsed.activeListTab || "main");
          setLaps(parsed.laps || []);
          setRunning(!!parsed.running);
          setStartedAt(parsed.startedAt || null);
          setAccumulated(parsed.accumulated || 0);
          setActiveMapId(parsed.activeMapId || null);
        }
      } catch (e) {
        // no saved session yet
      }
      try {
        const h = await window.storage.get(HISTORY_KEY);
        if (h && h.value) setHistory(migrateHistory(JSON.parse(h.value)));
      } catch (e) {
        // no history yet
      }
      try {
        const m = await window.storage.get(MAPS_KEY);
        if (m && m.value) {
          setMaps(JSON.parse(m.value));
        } else {
          setMaps(DEFAULT_MAPS);
          await window.storage.set(MAPS_KEY, JSON.stringify(DEFAULT_MAPS), false);
        }
      } catch (e) {
        setMaps(DEFAULT_MAPS);
        try {
          await window.storage.set(MAPS_KEY, JSON.stringify(DEFAULT_MAPS), false);
        } catch (e2) {
          console.error("Failed to seed maps", e2);
        }
      }
      try {
        const di = await window.storage.get(DEFAULT_ITEMS_KEY);
        if (di && di.value) setDefaultItems(JSON.parse(di.value));
      } catch (e) {
        // no default items template saved yet
      }
      try {
        const md = await window.storage.get(MONSTERS_KEY);
        if (md && md.value) {
          setMonsters(JSON.parse(md.value));
        } else {
          setMonsters(DEFAULT_MONSTERS);
          await window.storage.set(MONSTERS_KEY, JSON.stringify(DEFAULT_MONSTERS), false);
        }
      } catch (e) {
        setMonsters(DEFAULT_MONSTERS);
        try {
          await window.storage.set(MONSTERS_KEY, JSON.stringify(DEFAULT_MONSTERS), false);
        } catch (e2) {
          console.error("Failed to seed monsters", e2);
        }
      }
      try {
        const ci = await window.storage.get(CUSTOM_ITEMS_KEY);
        if (ci && ci.value) setCustomItems(JSON.parse(ci.value));
      } catch (e) {
        // no custom items saved yet
      }
      setLoaded(true);
    })();
  }, []);

  // Autosave session on change
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set(
          SESSION_KEY,
          JSON.stringify({ items, extraItems, costItems, activeListTab, running, startedAt, accumulated, activeMapId, laps }),
          false
        );
      } catch (e) {
        console.error("Failed to save session", e);
      }
    })();
  }, [items, extraItems, costItems, activeListTab, running, startedAt, accumulated, activeMapId, laps, loaded]);

  // Autosave custom (user-added) items on change
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set(CUSTOM_ITEMS_KEY, JSON.stringify(customItems), false);
      } catch (e) {
        console.error("Failed to save custom items", e);
      }
    })();
  }, [customItems, loaded]);

  // Autosave history on change
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set(HISTORY_KEY, JSON.stringify(history), false);
      } catch (e) {
        console.error("Failed to save history", e);
      }
    })();
  }, [history, loaded]);

  // Ticking clock
  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    } else if (tickRef.current) {
      clearInterval(tickRef.current);
    }
    return () => tickRef.current && clearInterval(tickRef.current);
  }, [running]);

  const elapsedMs = accumulated + (running ? now - startedAt : 0);
  const mainGross = items.reduce((sum, it) => sum + (it.qty || 0) * (it.sell || 0), 0);
  const extraGross = extraItems.reduce((sum, it) => sum + (it.qty || 0) * (it.sell || 0), 0);
  const totalCosts = costItems.reduce((sum, it) => sum + (it.qty || 0) * (it.sell || 0), 0);
  // "Official" total: Main minus Costs. Extras are shown separately and left
  // out here since they don't drop consistently and would skew the rate.
  const grandTotal = mainGross - totalCosts;
  const combinedTotal = mainGross + extraGross - totalCosts;
  const hours = elapsedMs / 3600000;
  const zenyPerHour = hours > 0.0005 ? grandTotal / hours : 0;
  const trackedCount = [...items, ...extraItems]
    .filter((it) => it.count)
    .reduce((sum, it) => sum + (it.qty || 0), 0);
  const trackedItemNames = [...items, ...extraItems].filter((it) => it.count && it.name.trim()).map((it) => it.name.trim());

  const toggleTimer = () => {
    if (running) {
      setAccumulated(accumulated + (Date.now() - startedAt));
      setStartedAt(null);
      setRunning(false);
    } else {
      const startTime = Date.now();
      setStartedAt(startTime);
      setNow(startTime);
      setRunning(true);
    }
  };

  const resetTimer = () => {
    setRunning(false);
    setStartedAt(null);
    setAccumulated(0);
    setLaps([]);
  };

  const updateSessionTime = (field, value) => {
    const hms = msToHMS(elapsedMs);
    hms[field] = Math.max(0, parseInt(value, 10) || 0);
    const newMs = hmsToMs(hms.h, hms.m, hms.s);
    if (running) {
      setAccumulated(newMs - (Date.now() - startedAt));
    } else {
      setAccumulated(newMs);
    }
  };

  const addTimerMinutes = (minutes) => {
    const newMs = elapsedMs + minutes * 60 * 1000;
    if (running) {
      setAccumulated(newMs - (Date.now() - startedAt));
      setNow(Date.now());
    } else {
      setAccumulated(newMs);
    }
  };

  const addLap = () => {
    setLaps([...laps, { id: uid(), ms: elapsedMs }]);
  };

  const removeLap = (id) => setLaps(laps.filter((l) => l.id !== id));

  const clearLaps = () => setLaps([]);

  const getListByTab = (tab) => (tab === "main" ? items : tab === "extras" ? extraItems : costItems);
  const setListByTabDirect = (tab, newList) => {
    if (tab === "main") setItems(newList);
    else if (tab === "extras") setExtraItems(newList);
    else setCostItems(newList);
  };
  const getActiveList = () => getListByTab(activeListTab);
  const setActiveList = (newList) => setListByTabDirect(activeListTab, newList);

  const updateItem = (id, field, value) => {
    setActiveList(
      getActiveList().map((it) => {
        if (it.id !== id) return it;
        if (field === "name") {
          // Re-guess the type as the name changes, unless the person already
          // picked a type manually for this row.
          const type = it.typeManual ? it.type : defaultTypeFor(value);
          return { ...it, name: value, type };
        }
        if (field === "type") {
          return { ...it, type: value, typeManual: true };
        }
        return { ...it, [field]: value };
      })
    );
    if (field === "sell") {
      const current = getActiveList().find((it) => it.id === id);
      if (current) registerUnknownItems([{ name: current.name, sell: value }]);
    }
  };

  const removeItem = (id) => setActiveList(getActiveList().filter((it) => it.id !== id));

  const addBlankItem = () => {
    setActiveList([...getActiveList(), { id: uid(), name: "", qty: 0, sell: 0, sellType: "vend", type: "misc", typeManual: false, count: false }]);
  };

  const toggleSellType = (id) => {
    setActiveList(
      getActiveList().map((it) =>
        it.id === id ? { ...it, sellType: it.sellType === "npc" ? "vend" : "npc" } : it
      )
    );
  };

  const toggleItemCount = (id) => {
    setActiveList(getActiveList().map((it) => (it.id === id ? { ...it, count: !it.count } : it)));
  };

  // Clear bulk selection whenever the active tab changes — selections are
  // scoped to whichever list is currently visible.
  useEffect(() => {
    setBulkSelectedIds([]);
  }, [activeListTab]);

  const toggleBulkSelect = (id) => {
    setBulkSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleBulkSelectAll = () => {
    const allIds = getActiveList().map((it) => it.id);
    setBulkSelectedIds((prev) => (prev.length === allIds.length ? [] : allIds));
  };

  const bulkDeleteSelected = () => {
    setActiveList(getActiveList().filter((it) => !bulkSelectedIds.includes(it.id)));
    setBulkSelectedIds([]);
  };

  const bulkMoveSelected = (targetTab) => {
    if (targetTab === activeListTab) return;
    const selected = getActiveList().filter((it) => bulkSelectedIds.includes(it.id));
    if (selected.length === 0) return;
    setActiveList(getActiveList().filter((it) => !bulkSelectedIds.includes(it.id)));
    setListByTab(targetTab, [...getListByTab(targetTab), ...selected]);
    setBulkSelectedIds([]);
  };

  // Drag-and-drop reordering + moving items between Main/Extras
  const [dragItemId, setDragItemId] = useState(null);
  const [dragSourceTab, setDragSourceTab] = useState(null);
  const [dragOverItemId, setDragOverItemId] = useState(null);
  const [dragOverTab, setDragOverTab] = useState(null);

  const setListByTab = setListByTabDirect;

  const reorderWithinList = (tab, draggedId, overId) => {
    const list = getListByTab(tab);
    const fromIdx = list.findIndex((it) => it.id === draggedId);
    const toIdx = list.findIndex((it) => it.id === overId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    const newList = [...list];
    const [moved] = newList.splice(fromIdx, 1);
    newList.splice(toIdx, 0, moved);
    setListByTab(tab, newList);
  };

  const moveItemToTab = (itemId, sourceTab, targetTab) => {
    if (sourceTab === targetTab) return;
    const sourceList = getListByTab(sourceTab);
    const idx = sourceList.findIndex((it) => it.id === itemId);
    if (idx === -1) return;
    const moved = sourceList[idx];
    setListByTab(sourceTab, sourceList.filter((it) => it.id !== itemId));
    setListByTab(targetTab, [...getListByTab(targetTab), moved]);
    setActiveListTab(targetTab);
  };

  const startDrag = (e, itemId) => {
    e.preventDefault();
    setDragItemId(itemId);
    setDragSourceTab(activeListTab);
  };

  useEffect(() => {
    if (!dragItemId) return;
    let finished = false;

    const handleMove = (e) => {
      const point = e.touches ? e.touches[0] : e;
      const el = document.elementFromPoint(point.clientX, point.clientY);
      const tabEl = el?.closest("[data-drag-tab]");
      const rowEl = el?.closest("[data-drag-item-id]");
      if (tabEl) {
        setDragOverTab(tabEl.getAttribute("data-drag-tab"));
        setDragOverItemId(null);
      } else if (rowEl) {
        setDragOverItemId(rowEl.getAttribute("data-drag-item-id"));
        setDragOverTab(null);
      } else {
        setDragOverItemId(null);
        setDragOverTab(null);
      }
    };

    const handleUp = () => {
      if (finished) return;
      finished = true;
      if (dragOverTab && dragOverTab !== dragSourceTab) {
        moveItemToTab(dragItemId, dragSourceTab, dragOverTab);
      } else if (dragOverItemId && dragOverItemId !== dragItemId) {
        reorderWithinList(dragSourceTab, dragItemId, dragOverItemId);
      }
      setDragItemId(null);
      setDragSourceTab(null);
      setDragOverItemId(null);
      setDragOverTab(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
      document.body.style.userSelect = "";
    };
  }, [dragItemId, dragSourceTab, dragOverItemId, dragOverTab, items, extraItems]);

  const selectMap = (map) => {
    setActiveMapId(map.id);
    setItems(
      map.items.map((it) => ({ id: uid(), name: it.name, qty: 0, sell: it.sell, sellType: "vend", type: defaultTypeFor(it.name), typeManual: false, count: !!it.count }))
    );
    setExtraItems(
      (map.extraItems || []).map((it) => ({ id: uid(), name: it.name, qty: 0, sell: it.sell, sellType: "vend", type: defaultTypeFor(it.name), typeManual: false, count: !!it.count }))
    );
    setCostItems(
      (map.costs || []).map((it) => ({ id: uid(), name: it.name, qty: 0, sell: it.sell, sellType: "vend", type: defaultTypeFor(it.name), typeManual: false, count: !!it.count }))
    );
  };

  // Drag-and-drop reordering for the map tabs.
  const [dragMapId, setDragMapId] = useState(null);
  const [dragOverMapId, setDragOverMapId] = useState(null);

  const startMapDrag = (e, mapId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragMapId(mapId);
  };

  const persistMapsOrder = async (newMaps) => {
    setMaps(newMaps);
    try {
      await window.storage.set(MAPS_KEY, JSON.stringify(newMaps), false);
    } catch (e) {
      console.error("Failed to save map order", e);
    }
  };

  useEffect(() => {
    if (!dragMapId) return;
    let finished = false;

    const handleMove = (e) => {
      const point = e.touches ? e.touches[0] : e;
      const el = document.elementFromPoint(point.clientX, point.clientY);
      const tabEl = el?.closest("[data-drag-map-id]");
      setDragOverMapId(tabEl ? tabEl.getAttribute("data-drag-map-id") : null);
    };

    const handleUp = () => {
      if (finished) return;
      finished = true;
      if (dragOverMapId && dragOverMapId !== dragMapId) {
        const fromIdx = maps.findIndex((m) => m.id === dragMapId);
        const toIdx = maps.findIndex((m) => m.id === dragOverMapId);
        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
          const newMaps = [...maps];
          const [moved] = newMaps.splice(fromIdx, 1);
          newMaps.splice(toIdx, 0, moved);
          persistMapsOrder(newMaps);
        }
      }
      setDragMapId(null);
      setDragOverMapId(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
      document.body.style.userSelect = "";
    };
  }, [dragMapId, dragOverMapId, maps]);

  const openNewMapForm = () =>
    setMapForm({
      mode: "new",
      id: null,
      name: "",
      text: mapItemsToText(defaultItems.items || []),
      extraText: mapItemsToText(defaultItems.extraItems || []),
      costText: "",
    });

  const openEditMapForm = (map) => {
    const countMap = {};
    [...map.items, ...(map.extraItems || []), ...(map.costs || [])].forEach((it) => {
      if (it.count) countMap[it.name.trim().toLowerCase()] = true;
    });
    setMapForm({
      mode: "edit",
      id: map.id,
      name: map.name,
      text: mapItemsToText(map.items),
      extraText: mapItemsToText(map.extraItems || []),
      costText: mapItemsToText(map.costs || []),
      countMap,
    });
  };

  const openSaveCurrentAsMapForm = () => {
    const countMap = {};
    [...items, ...extraItems, ...costItems].forEach((it) => {
      if (it.count && it.name.trim()) countMap[it.name.trim().toLowerCase()] = true;
    });
    setMapForm({
      mode: "new",
      id: null,
      name: "",
      text: mapItemsToText(items.filter((it) => it.name.trim())),
      extraText: mapItemsToText(extraItems.filter((it) => it.name.trim())),
      costText: mapItemsToText(costItems.filter((it) => it.name.trim())),
      countMap,
    });
  };

  const closeMapForm = () => setMapForm(null);

  const openDefaultItemsForm = () =>
    setDefaultItemsForm({
      text: mapItemsToText(defaultItems.items || []),
      extraText: mapItemsToText(defaultItems.extraItems || []),
    });

  const closeDefaultItemsForm = () => setDefaultItemsForm(null);

  const saveDefaultItemsForm = async () => {
    if (!defaultItemsForm) return;
    const newDefaults = {
      items: parseBulkItems(defaultItemsForm.text),
      extraItems: parseBulkItems(defaultItemsForm.extraText || ""),
    };
    registerUnknownItems([...newDefaults.items, ...newDefaults.extraItems]);
    setDefaultItems(newDefaults);
    try {
      await window.storage.set(DEFAULT_ITEMS_KEY, JSON.stringify(newDefaults), false);
    } catch (e) {
      console.error("Failed to save default items", e);
    }
    setDefaultItemsForm(null);
  };

  // Saves the current Main/Extras/Costs lists back into whichever map is
  // currently selected, without needing to go through the New/Edit Map form.
  const updateActiveMap = async () => {
    if (!activeMapId) return;
    const newItems = items
      .filter((it) => it.name.trim())
      .map((it) => ({ name: it.name.trim(), sell: it.sell || 0, count: !!it.count }));
    const newExtras = extraItems
      .filter((it) => it.name.trim())
      .map((it) => ({ name: it.name.trim(), sell: it.sell || 0, count: !!it.count }));
    const newCosts = costItems
      .filter((it) => it.name.trim())
      .map((it) => ({ name: it.name.trim(), sell: it.sell || 0, count: !!it.count }));
    registerUnknownItems([...newItems, ...newExtras, ...newCosts]);
    const newMaps = maps.map((m) =>
      m.id === activeMapId ? { ...m, items: newItems, extraItems: newExtras, costs: newCosts } : m
    );
    setMaps(newMaps);
    try {
      await window.storage.set(MAPS_KEY, JSON.stringify(newMaps), false);
    } catch (e) {
      console.error("Failed to update map", e);
    }
    setMapUpdateFlash(true);
    setTimeout(() => setMapUpdateFlash(false), 1600);
  };

  const saveMapForm = async () => {
    if (!mapForm) return;
    const countMap = mapForm.countMap || {};
    const withCount = (parsed) =>
      parsed.map((it) => ({ ...it, count: !!countMap[it.name.trim().toLowerCase()] }));
    const parsedItems = withCount(parseBulkItems(mapForm.text));
    const parsedExtras = withCount(parseBulkItems(mapForm.extraText || ""));
    const parsedCosts = withCount(parseBulkItems(mapForm.costText || ""));
    if (!mapForm.name.trim()) return;
    registerUnknownItems([...parsedItems, ...parsedExtras, ...parsedCosts]);

    let newMaps;
    let savedMap;
    if (mapForm.mode === "edit") {
      newMaps = maps.map((m) =>
        m.id === mapForm.id
          ? { ...m, name: mapForm.name.trim(), items: parsedItems, extraItems: parsedExtras, costs: parsedCosts }
          : m
      );
      savedMap = newMaps.find((m) => m.id === mapForm.id);
    } else {
      savedMap = { id: uid(), name: mapForm.name.trim(), items: parsedItems, extraItems: parsedExtras, costs: parsedCosts };
      newMaps = [...maps, savedMap];
    }
    setMaps(newMaps);
    try {
      await window.storage.set(MAPS_KEY, JSON.stringify(newMaps), false);
    } catch (e) {
      console.error("Failed to save map", e);
    }
    setMapForm(null);
    selectMap(savedMap);
  };

  const deleteMap = async (id) => {
    const newMaps = maps.filter((m) => m.id !== id);
    setMaps(newMaps);
    if (activeMapId === id) setActiveMapId(null);
    try {
      await window.storage.set(MAPS_KEY, JSON.stringify(newMaps), false);
    } catch (e) {
      console.error("Failed to delete map", e);
    }
    setMapForm(null);
  };

  // Looks up a previously-used sell price for an item name across the current
  // session and all saved maps, so adding a monster's drops doesn't wipe out
  // prices you've already set elsewhere.
  const findKnownSellPrice = (itemName) => {
    const lower = itemName.trim().toLowerCase();
    const pools = [items, extraItems, ...maps.flatMap((m) => [m.items || [], m.extraItems || []])];
    for (const pool of pools) {
      const hit = pool.find((it) => (it.name || "").trim().toLowerCase() === lower);
      if (hit && hit.sell) return hit.sell;
    }
    return 0;
  };

  // For items that aren't already registered anywhere (a saved map or the
  // current session), the monster database only has the base NPC sell price.
  // Default those to base * 1.24 (rounded down) instead of the raw value.
  const defaultSellFor = (dropItem) => {
    const known = findKnownSellPrice(dropItem.name);
    if (known) return known;
    return Math.floor((dropItem.sell || 0) * 1.24);
  };

  const isCardItem = (name) => /card$/i.test(name.trim());

  // Each item carries an explicit `type`: "equip" | "use" | "misc". There's
  // no official item database to pull real types from, so new items get a
  // best-effort default based on common RO naming patterns — but once set,
  // the type is stored on the item itself (editable via the dropdown in the
  // table) rather than being re-guessed every render, so corrections stick.
  const EQUIP_KEYWORDS = [
    "Sword", "Blade", "Dagger", "Knife", "Katar", "Mace", "Hammer", "Axe", "Spear", "Lance",
    "Rod", "Wand", "Staff", "Bow", "Whip", "Katana", "Saber", "Rapier", "Scythe",
    "Guitar", "Harp", "Flute", "Violin", "Mandolin", "Lute", "Book", "Knuckle", "Claw", "Chakram",
    "Armor", "Mail", "Plate", "Robe", "Suit", "Jacket",
    "Hat", "Cap", "Helm", "Helmet", "Crown", "Circlet", "Bandana", "Ribbon", "Mask", "Hood", "Wig", "Tiara",
    "Boots", "Shoes", "Sandals", "Greaves",
    "Muffler", "Manteau", "Cape", "Cloak", "Shawl",
    "Shield", "Buckler",
    "Ring", "Necklace", "Earring", "Belt", "Glove", "Gloves", "Bracelet", "Clip", "Brooch", "Rosary", "Amulet",
  ];
  const USE_KEYWORDS = [
    "Potion", "Elixir", "Antidote", "Panacea", "Ointment", "Holy Water",
    "Scroll", "Fly Wing", "Butterfly Wing", "Yggdrasil", "Convert", "Fruit", "Berry", "Bun", "Juice", "Meat", "Bread",
  ];

  const matchesAny = (name, keywords) => keywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(name.trim()));

  // A handful of item names don't follow the generic keyword patterns above
  // (weapon/skill items named after themselves rather than a gear-type word).
  const TYPE_OVERRIDES = {
    "partizan": "equip",
    "chain": "equip",
    "fire wall": "use",
    "hand of god": "equip",
  };

  const CATEGORY_ORDER = { use: 0, equip: 1, misc: 2 };

  const defaultTypeFor = (name) => {
    const n = (name || "").trim();
    if (!n) return "misc";
    const known = ITEM_METADATA[n.toLowerCase()];
    if (known) return known[1];
    const override = TYPE_OVERRIDES[n.toLowerCase()];
    if (override) return override;
    if (/^Level\s+\d+\s+/i.test(n)) return "use"; // e.g. "Level 5 Fire Wall" skill scrolls
    if (isCardItem(n)) return "misc"; // Cards live in RO's Etc tab, not Equipment
    if (matchesAny(n, EQUIP_KEYWORDS)) return "equip";
    if (matchesAny(n, USE_KEYWORDS)) return "use";
    return "misc";
  };

  const itemIdFor = (name) => {
    const known = ITEM_METADATA[(name || "").trim().toLowerCase()];
    return known ? known[0] : null;
  };

  const itemOfficialSellFor = (name) => {
    const known = ITEM_METADATA[(name || "").trim().toLowerCase()];
    return known ? known[2] : null;
  };

  const belongsInExtras = (name) => isCardItem(name) || defaultTypeFor(name) === "equip";

  const sortActiveListByCategory = () => {
    const sorted = [...getActiveList()].sort(
      (a, b) => CATEGORY_ORDER[a.type || "misc"] - CATEGORY_ORDER[b.type || "misc"]
    );
    setActiveList(sorted);
  };

  const sortActiveListByName = () => {
    const nextDir = nameSortDir === "asc" ? "desc" : "asc";
    const sorted = [...getActiveList()].sort((a, b) => {
      const cmp = a.name.trim().toLowerCase().localeCompare(b.name.trim().toLowerCase());
      return nextDir === "asc" ? cmp : -cmp;
    });
    setActiveList(sorted);
    setNameSortDir(nextDir);
  };

  const addMonsterDropsToActiveList = (monster) => {
    // Cards and equipment always land in Extras, even if Main is the active
    // tab. Everything else goes to whichever tab is currently active.
    if (activeListTab === "extras") {
      const existingNames = new Set(extraItems.map((it) => it.name.trim().toLowerCase()));
      const rows = monster.items
        .filter((it) => !existingNames.has(it.name.trim().toLowerCase()))
        .map((it) => ({ id: uid(), name: it.name, qty: 0, sell: defaultSellFor(it), sellType: "vend", type: defaultTypeFor(it.name), typeManual: false, count: false }));
      if (rows.length > 0) setExtraItems([...extraItems, ...rows]);
    } else {
      const toMain = monster.items.filter((it) => !belongsInExtras(it.name));
      const toExtras = monster.items.filter((it) => belongsInExtras(it.name));

      const existingMainNames = new Set(items.map((it) => it.name.trim().toLowerCase()));
      const mainRows = toMain
        .filter((it) => !existingMainNames.has(it.name.trim().toLowerCase()))
        .map((it) => ({ id: uid(), name: it.name, qty: 0, sell: defaultSellFor(it), sellType: "vend", type: defaultTypeFor(it.name), typeManual: false, count: false }));

      const existingExtraNames = new Set(extraItems.map((it) => it.name.trim().toLowerCase()));
      const extraRows = toExtras
        .filter((it) => !existingExtraNames.has(it.name.trim().toLowerCase()))
        .map((it) => ({ id: uid(), name: it.name, qty: 0, sell: defaultSellFor(it), sellType: "vend", type: defaultTypeFor(it.name), typeManual: false, count: false }));

      if (mainRows.length > 0) setItems([...items, ...mainRows]);
      if (extraRows.length > 0) setExtraItems([...extraItems, ...extraRows]);
    }
    setMonsterQuery("");
    setMonsterDropdownOpen(false);
  };

  const openNewMonsterForm = () => setMonsterForm({ mode: "new", id: null, name: "", text: "" });

  const openEditMonsterForm = (monster) => {
    setMonsterForm({ mode: "edit", id: monster.id, name: monster.name, text: mapItemsToText(monster.items) });
  };

  const closeMonsterForm = () => setMonsterForm(null);

  const saveMonsterForm = async () => {
    if (!monsterForm) return;
    const parsedItems = parseBulkItems(monsterForm.text);
    if (!monsterForm.name.trim() || parsedItems.length === 0) return;

    let newMonsters;
    if (monsterForm.mode === "edit") {
      newMonsters = monsters.map((m) =>
        m.id === monsterForm.id ? { ...m, name: monsterForm.name.trim(), items: parsedItems } : m
      );
    } else {
      newMonsters = [...monsters, { id: uid(), name: monsterForm.name.trim(), items: parsedItems }];
    }
    setMonsters(newMonsters);
    try {
      await window.storage.set(MONSTERS_KEY, JSON.stringify(newMonsters), false);
    } catch (e) {
      console.error("Failed to save monster", e);
    }
    setMonsterForm(null);
  };

  const deleteMonster = async (id) => {
    const newMonsters = monsters.filter((m) => m.id !== id);
    setMonsters(newMonsters);
    try {
      await window.storage.set(MONSTERS_KEY, JSON.stringify(newMonsters), false);
    } catch (e) {
      console.error("Failed to delete monster", e);
    }
    setMonsterForm(null);
  };

  const filteredMonsters = useMemo(() => {
    const q = monsterQuery.trim();
    if (!q) return monsters.slice(0, 40);
    return monsters
      .map((m) => ({ m, score: fuzzyScore(q, m.name) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((x) => x.m);
  }, [monsterQuery, monsters]);

  // Every known item across all monster drop tables and all saved maps,
  // deduped by name, for a direct "search one item and add it" flow. This is
  // the most expensive derived value in the app (thousands of entries), so
  // it's memoized on its real dependencies only — previously it rebuilt on
  // every render, including every second the timer ticked.
  const allKnownItems = useMemo(() => {
    const seen = new Map();
    monsters.forEach((m) =>
      m.items.forEach((it) => {
        const key = it.name.trim().toLowerCase();
        if (key && !seen.has(key)) seen.set(key, { name: it.name.trim(), sell: it.sell || 0 });
      })
    );
    maps.forEach((mp) => {
      [...(mp.items || []), ...(mp.extraItems || []), ...(mp.costs || [])].forEach((it) => {
        const key = (it.name || "").trim().toLowerCase();
        if (key && !seen.has(key)) seen.set(key, { name: it.name.trim(), sell: it.sell || 0 });
      });
    });
    customItems.forEach((it) => {
      const key = (it.name || "").trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, { name: it.name.trim(), sell: it.sell || 0 });
    });

    // Surface card-slot equipment variants (e.g. Chain[2], Chain[3]) as their
    // own searchable/addable entries alongside the base item name.
    const baseEntries = Array.from(seen.values());
    baseEntries.forEach((base) => {
      const baseKey = base.name.toLowerCase();
      for (let slots = 1; slots <= 4; slots++) {
        const variantKey = `${baseKey}[${slots}]`;
        const variant = ITEM_METADATA[variantKey];
        if (variant) {
          const displayName = `${base.name}[${slots}]`;
          const displayKey = displayName.toLowerCase();
          if (!seen.has(displayKey)) {
            seen.set(displayKey, { name: displayName, sell: variant[2] || 0 });
          }
        }
      }
    });

    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [monsters, maps, customItems]);

  // Whenever an item is added/saved that isn't already in the searchable
  // database (monster drops, saved maps, or previously-registered custom
  // items), remember it so it shows up in search next time.
  const registerUnknownItems = (itemsToCheck) => {
    const known = new Set(allKnownItems.map((it) => it.name.trim().toLowerCase()));
    const additions = [];
    const addedThisCall = new Set();
    itemsToCheck.forEach((it) => {
      const name = (it.name || "").trim();
      if (!name || !it.sell) return;
      const key = name.toLowerCase();
      if (known.has(key) || addedThisCall.has(key)) return;
      addedThisCall.add(key);
      additions.push({ name, sell: it.sell });
    });
    if (additions.length > 0) {
      setCustomItems((prev) => [...prev, ...additions]);
    }
  };

  const fuzzyFilterItems = (list, query) => {
    const q = query.trim();
    if (!q) return list.slice(0, 40);
    return list
      .map((it) => ({ it, score: fuzzyScore(q, it.name) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((x) => x.it);
  };

  const filteredItems = useMemo(() => fuzzyFilterItems(allKnownItems, itemQuery), [itemQuery, allKnownItems]);

  const filteredDefaultItems = useMemo(
    () => fuzzyFilterItems(allKnownItems, defaultItemQuery),
    [defaultItemQuery, allKnownItems]
  );

  // Adds a single searched item into the Default Items form — cards and
  // equipment go into the default Extras list, everything else goes into
  // the default Main list. Mirrors how single-item search works for the
  // active session.
  const addItemToDefaults = (item) => {
    if (!defaultItemsForm) return;
    const targetIsExtras = belongsInExtras(item.name);
    const field = targetIsExtras ? "extraText" : "text";
    const existingNames = new Set(parseBulkItems(defaultItemsForm[field]).map((it) => it.name.toLowerCase()));
    if (!existingNames.has(item.name.toLowerCase())) {
      const line = `${item.name}\t${defaultSellFor(item)}`;
      const current = defaultItemsForm[field];
      const updated = current.trim() ? `${current}\n${line}` : line;
      setDefaultItemsForm({ ...defaultItemsForm, [field]: updated });
    }
    setDefaultItemQuery("");
    setDefaultItemDropdownOpen(false);
  };

  // Adds a single searched item to the appropriate list. On the Costs tab it
  // always goes straight into Costs. Otherwise, cards and equipment always
  // go to Extras, everything else goes to whichever tab is currently active.
  const addItemToList = (item) => {
    if (activeListTab === "costs") {
      const exists = costItems.some((it) => it.name.trim().toLowerCase() === item.name.trim().toLowerCase());
      if (!exists) {
        const row = { id: uid(), name: item.name, qty: 0, sell: defaultSellFor(item), sellType: "vend", type: defaultTypeFor(item.name), typeManual: false, count: false };
        setCostItems([...costItems, row]);
      }
      setItemQuery("");
      setItemDropdownOpen(false);
      return;
    }
    const targetIsExtras = belongsInExtras(item.name) || activeListTab === "extras";
    const targetList = targetIsExtras ? extraItems : items;
    const exists = targetList.some((it) => it.name.trim().toLowerCase() === item.name.trim().toLowerCase());
    if (!exists) {
      const row = { id: uid(), name: item.name, qty: 0, sell: defaultSellFor(item), sellType: "vend", type: defaultTypeFor(item.name), typeManual: false, count: false };
      if (targetIsExtras) setExtraItems([...extraItems, row]);
      else setItems([...items, row]);
    }
    setItemQuery("");
    setItemDropdownOpen(false);
  };

  const endSession = async () => {
    const combined = [...items, ...extraItems];
    if (combined.length === 0 && costItems.length === 0 && elapsedMs < 1000) return;
    registerUnknownItems([...combined, ...costItems]);
    const entry = {
      id: uid(),
      date: Date.now(),
      mapName: maps.find((m) => m.id === activeMapId)?.name || null,
      durationMs: elapsedMs,
      items: items
        .filter((it) => (it.qty || 0) > 0)
        .map((it) => ({ id: uid(), name: it.name, qty: it.qty || 0, sell: it.sell || 0 })),
      extraItems: extraItems
        .filter((it) => (it.qty || 0) > 0)
        .map((it) => ({ id: uid(), name: it.name, qty: it.qty || 0, sell: it.sell || 0 })),
      costs: costItems
        .filter((it) => (it.qty || 0) > 0)
        .map((it) => ({ id: uid(), name: it.name, qty: it.qty || 0, sell: it.sell || 0 })),
    };
    const updatedHistory = [entry, ...history];
    // Save before clearing the active session so an immediate close cannot
    // interrupt the normal state-change autosave.
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Failed to save session history immediately", error);
    }
    setHistory(updatedHistory);
    setHistoryPage(1);
    setItems([]);
    setExtraItems([]);
    setCostItems([]);
    setRunning(false);
    setStartedAt(null);
    setAccumulated(0);
    setLaps([]);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1600);
  };

  const toggleHistoryExpand = (id) => setExpandedHistoryId(expandedHistoryId === id ? null : id);

  const updateHistoryDuration = (id, field, value) => {
    setHistory(
      history.map((h) => {
        if (h.id !== id) return h;
        const hms = msToHMS(h.durationMs);
        hms[field] = Math.max(0, parseInt(value, 10) || 0);
        return { ...h, durationMs: hmsToMs(hms.h, hms.m, hms.s) };
      })
    );
  };

  const updateHistoryItem = (histId, listKey, itemId, field, value) => {
    setHistory(
      history.map((h) =>
        h.id !== histId
          ? h
          : { ...h, [listKey]: (h[listKey] || []).map((it) => (it.id === itemId ? { ...it, [field]: value } : it)) }
      )
    );
  };

  const removeHistoryItem = (histId, listKey, itemId) => {
    setHistory(
      history.map((h) =>
        h.id !== histId ? h : { ...h, [listKey]: (h[listKey] || []).filter((it) => it.id !== itemId) }
      )
    );
  };

  const addHistoryItem = (histId, listKey) => {
    setHistory(
      history.map((h) =>
        h.id !== histId ? h : { ...h, [listKey]: [...(h[listKey] || []), { id: uid(), name: "", qty: 0, sell: 0 }] }
      )
    );
  };

  const updateHistoryNotes = (histId, notes) => {
    setHistory(history.map((h) => (h.id !== histId ? h : { ...h, notes })));
  };


  const deleteHistoryEntry = (id) => {
    const index = history.findIndex((h) => h.id === id);
    if (index === -1) return;
    const entry = history[index];
    setHistory(history.filter((h) => h.id !== id));
    if (expandedHistoryId === id) setExpandedHistoryId(null);
    setCombineSelectedIds(combineSelectedIds.filter((cid) => cid !== id));

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoDeleted({ entry, index });
    undoTimerRef.current = setTimeout(() => setUndoDeleted(null), 6000);
  };

  const undoDeleteHistoryEntry = () => {
    if (!undoDeleted) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setHistory((h) => {
      const restored = [...h];
      restored.splice(Math.min(undoDeleted.index, restored.length), 0, undoDeleted.entry);
      return restored;
    });
    setUndoDeleted(null);
  };

  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

  const toggleCombineSelect = (id) => {
    setCombineSelectedIds(
      combineSelectedIds.includes(id) ? combineSelectedIds.filter((cid) => cid !== id) : [...combineSelectedIds, id]
    );
  };

  const combineSelectedEntries = history.filter((h) => combineSelectedIds.includes(h.id));

  // Sessions can only be combined if they're all from the same map, and no
  // gap between consecutive sessions (sorted by when they were saved)
  // exceeds 48 hours.
  const combineValidation = (() => {
    if (combineSelectedEntries.length < 2) return { valid: false, reason: null };
    const mapNames = new Set(combineSelectedEntries.map((h) => h.mapName || null));
    if (mapNames.size > 1 || mapNames.has(null)) {
      return { valid: false, reason: "Selected sessions must all be from the same map." };
    }
    const sorted = [...combineSelectedEntries].sort((a, b) => a.date - b.date);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].date - sorted[i - 1].date > FORTY_EIGHT_HOURS_MS) {
        return { valid: false, reason: "Selected sessions must each be within 48 hours of the next." };
      }
    }
    return { valid: true, reason: null };
  })();

  const combineSessions = async () => {
    if (!combineValidation.valid) return;
    const sorted = [...combineSelectedEntries].sort((a, b) => a.date - b.date);

    // Merge items by name, summing quantity; later sessions' sell price and
    // count flag win if they differ.
    const mergeByName = (getList) => {
      const map = new Map();
      sorted.forEach((entry) => {
        (getList(entry) || []).forEach((it) => {
          const key = (it.name || "").trim().toLowerCase();
          if (!key) return;
          if (map.has(key)) {
            const existing = map.get(key);
            existing.qty += it.qty || 0;
            if (it.sell) existing.sell = it.sell;
            existing.count = existing.count || !!it.count;
          } else {
            map.set(key, { id: uid(), name: it.name.trim(), qty: it.qty || 0, sell: it.sell || 0, count: !!it.count });
          }
        });
      });
      return Array.from(map.values());
    };
    const mergedItems = mergeByName((entry) => entry.items);
    const mergedExtraItems = mergeByName((entry) => entry.extraItems);
    const mergedCosts = mergeByName((entry) => entry.costs);

    // Preserve every original timestamp, even from sessions that were
    // themselves already a combined entry, so nested combines don't lose
    // earlier history.
    const combinedFrom = sorted
      .flatMap((h) => (h.combinedFrom && h.combinedFrom.length > 0 ? h.combinedFrom : [h.date]))
      .sort((a, b) => a - b);

    const mergedEntry = {
      id: uid(),
      date: sorted[sorted.length - 1].date,
      mapName: sorted[0].mapName,
      durationMs: sorted.reduce((sum, h) => sum + (h.durationMs || 0), 0),
      items: mergedItems,
      extraItems: mergedExtraItems,
      costs: mergedCosts,
      combinedFrom,
    };

    const combinedIds = new Set(combineSelectedIds);
    const newHistory = [mergedEntry, ...history.filter((h) => !combinedIds.has(h.id))].sort((a, b) => b.date - a.date);
    setHistory(newHistory);
    setCombineSelectedIds([]);
    setExpandedHistoryId(mergedEntry.id);
  };

  const MAP_CHART_COLORS = ["#ff4b4b", "#ff4b4b", "#dc3545", "#7c3aed", "#16a34a", "#d97706", "#2563eb", "#a21caf"];
  const chartMapNames = useMemo(() => Array.from(new Set(history.map((h) => h.mapName || "Unknown"))), [history]);
  const mapColorFor = (name) => MAP_CHART_COLORS[chartMapNames.indexOf(name) % MAP_CHART_COLORS.length];

  // Sum every session's zeny total and duration into its calendar day (local
  // time), broken down per map, for the daily analytics chart.
  const dailyChartData = useMemo(() => {
    const byDay = new Map();
    history.forEach((h) => {
      const d = new Date(h.date);
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const mapName = h.mapName || "Unknown";
      const zeny = historyTotal(h);
      const extraZeny = historyExtraGross(h);
      const durationMs = h.durationMs || 0;

      if (!byDay.has(dayKey)) {
        byDay.set(dayKey, {
          dayKey,
          sortDate: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
          label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          fullDate: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
          totalZeny: 0,
          totalExtraZeny: 0,
          totalDurationMs: 0,
          byMap: {},
        });
      }
      const row = byDay.get(dayKey);
      row.totalZeny += zeny;
      row.totalExtraZeny += extraZeny;
      row.totalDurationMs += durationMs;
      if (!row.byMap[mapName]) row.byMap[mapName] = { zeny: 0, durationMs: 0 };
      row.byMap[mapName].zeny += zeny;
      row.byMap[mapName].durationMs += durationMs;
      // Flattened per-map keys so recharts can read them as individual bar
      // dataKeys when split-by-map is enabled.
      row[`z__${mapName}`] = (row[`z__${mapName}`] || 0) + zeny;
      row[`t__${mapName}`] = (row[`t__${mapName}`] || 0) + durationMs / 3600000;
      row.totalDurationHrs = row.totalDurationMs / 3600000;
    });
    return Array.from(byDay.values())
      .map((row) => ({
        ...row,
        zenyPerHr: row.totalDurationMs > 0 ? row.totalZeny / (row.totalDurationMs / 3600000) : 0,
      }))
      .sort((a, b) => a.sortDate - b.sortDate);
  }, [history]);

  const filteredHistory = useMemo(() => {
    let list = history;
    if (historyDateFilter !== "all") {
      const now = Date.now();
      const rangeMs = historyDateFilter === "today" ? 24 * 3600000 : historyDateFilter === "7d" ? 7 * 24 * 3600000 : 30 * 24 * 3600000;
      list = list.filter((h) => now - h.date <= rangeMs);
    }
    const q = historySearch.trim();
    if (!q) return list;
    return list
      .map((h) => {
        const mapScore = fuzzyScore(q, h.mapName || "");
        const noteScore = fuzzyScore(q, h.notes || "");
        return { h, score: Math.max(mapScore, noteScore) };
      })
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.h);
  }, [history, historySearch, historyDateFilter]);

  const historyPageCount = historyPageSize === "all"
    ? 1
    : Math.max(1, Math.ceil(filteredHistory.length / Number(historyPageSize)));
  const safeHistoryPage = Math.min(historyPage, historyPageCount);
  const visibleHistory = historyPageSize === "all"
    ? filteredHistory
    : filteredHistory.slice((safeHistoryPage - 1) * Number(historyPageSize), safeHistoryPage * Number(historyPageSize));

  const DailyChartTooltip = ({ active, payload, splitByMap }) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0].payload;
    return (
      <div
        style={{
          background: "#f3f4f6",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          padding: "8px 10px",
          fontSize: "0.75rem",
          minWidth: "150px",
        }}
      >
        <div style={{ color: "#374151", marginBottom: "4px" }}>{point.fullDate}</div>
        <div style={{ color: "#dc3545", fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>
          {fmtZeny(point.totalZeny)} z <span style={{ color: "#4b5563", fontWeight: 400, fontSize: "0.68rem" }}>main</span>
        </div>
        {point.totalExtraZeny > 0 && (
          <div style={{ color: "#ff4b4b", fontFamily: "ui-monospace, monospace", marginBottom: "2px", fontSize: "0.72rem" }}>
            +{fmtZeny(point.totalExtraZeny)} z extra
          </div>
        )}
        <div style={{ color: "#ff4b4b", fontFamily: "ui-monospace, monospace", marginBottom: "2px" }}>
          {fmtTime(point.totalDurationMs)} farmed
        </div>
        <div style={{ color: "#374151", fontFamily: "ui-monospace, monospace", marginBottom: splitByMap ? "6px" : 0 }}>
          {fmtZeny(point.zenyPerHr)} z/hr avg
        </div>
        {splitByMap && (
          <div style={{ borderTop: "1px solid #eef0f3", paddingTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
            {Object.entries(point.byMap).map(([name, v]) => (
              <div key={name} className="flex items-center justify-between gap-3">
                <span style={{ color: mapColorFor(name), fontSize: "0.7rem" }}>{name}</span>
                <span style={{ color: "#242631", fontFamily: "ui-monospace, monospace", fontSize: "0.7rem" }}>
                  {fmtZeny(v.zeny)}z · {fmtTime(v.durationMs)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Reusable mini item-table for the history editor — used once each for a
  // session's Main items, Extra (bonus) items, and Costs.
  const renderHistoryItemTable = ({ h, listKey, title, accentColor, addLabel }) => (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: "0.62rem", letterSpacing: "0.1em", color: accentColor, textTransform: "uppercase" }}>
          {title}
        </span>
      </div>
      {(h[listKey] || []).length > 0 && (
        <table className="w-full mb-1.5" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#eef0f3" }}>
              <th className="text-left px-2 py-1" style={{ fontSize: "0.62rem", letterSpacing: "0.1em", color: "#374151", textTransform: "uppercase", fontWeight: 500 }}>
                Item
              </th>
              <th className="text-left px-2 py-1" style={{ fontSize: "0.62rem", letterSpacing: "0.1em", color: "#374151", textTransform: "uppercase", fontWeight: 500, width: "70px" }}>
                Qty
              </th>
              <th className="text-left px-2 py-1" style={{ fontSize: "0.62rem", letterSpacing: "0.1em", color: "#374151", textTransform: "uppercase", fontWeight: 500, width: "90px" }}>
                Sell
              </th>
              <th className="text-left px-2 py-1" style={{ fontSize: "0.62rem", letterSpacing: "0.1em", color: "#374151", textTransform: "uppercase", fontWeight: 500, width: "100px" }}>
                Total
              </th>
              <th className="px-2 py-1" style={{ width: "28px" }} />
            </tr>
          </thead>
          <tbody>
            {(h[listKey] || []).map((it, idx) => (
              <tr key={it.id} style={{ background: idx % 2 === 0 ? "transparent" : "#f3f4f6", borderTop: "1px solid #eef0f3" }}>
                <td className="px-2 py-1">
                  <input
                    value={it.name}
                    onChange={(e) => updateHistoryItem(h.id, listKey, it.id, "name", e.target.value)}
                    placeholder="Item name"
                    className="bg-transparent outline-none w-full"
                    style={{ color: "#242631", fontSize: "0.8rem" }}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    value={it.qty === 0 ? "" : it.qty}
                    onChange={(e) => updateHistoryItem(h.id, listKey, it.id, "qty", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-transparent outline-none w-full"
                    style={{ color: "#242631", fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    value={it.sell === 0 ? "" : it.sell}
                    onChange={(e) => updateHistoryItem(h.id, listKey, it.id, "sell", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-transparent outline-none w-full"
                    style={{ color: "#374151", fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}
                  />
                </td>
                <td className="px-2 py-1" style={{ fontFamily: "ui-monospace, monospace", color: "#dc3545", fontSize: "0.8rem" }}>
                  {fmtZeny((it.qty || 0) * (it.sell || 0))}
                </td>
                <td className="px-2 py-1">
                  <button onClick={() => removeHistoryItem(h.id, listKey, it.id)} style={{ color: "#dc3545" }} title="Remove">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button
        onClick={() => addHistoryItem(h.id, listKey)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
        style={{ background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }}
      >
        <Plus size={12} />
        {addLabel}
      </button>
    </div>
  );

  const [backupOpen, setBackupOpen] = useState(false);
  const [backupMode, setBackupMode] = useState("export"); // "export" | "import"
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const importFileInputRef = useRef(null);

  const buildBackupPayload = () => ({
    version: 1,
    exportedAt: Date.now(),
    session: { items, extraItems, costItems, activeListTab, running, startedAt, accumulated, activeMapId, laps },
    history,
    maps,
    defaultItems,
    monsters,
    customItems,
  });

  // Rough storage usage per key, purely client-side (byte length of what
  // we'd actually write). Each key has its own 5MB ceiling, so this is
  // shown per-key rather than as one combined total.
  const STORAGE_KEY_LIMIT = 5 * 1024 * 1024;
  const byteLen = (v) => new Blob([JSON.stringify(v)]).size;
  const storageUsage = useMemo(
    () => [
      { label: "Session", bytes: byteLen({ items, extraItems, costItems, activeListTab, running, startedAt, accumulated, activeMapId, laps }) },
      { label: "History", bytes: byteLen(history) },
      { label: "Maps", bytes: byteLen(maps) },
      { label: "Default Items", bytes: byteLen(defaultItems) },
      { label: "Monsters", bytes: byteLen(monsters) },
      { label: "Custom Items", bytes: byteLen(customItems) },
    ],
    [items, extraItems, costItems, activeListTab, running, startedAt, accumulated, activeMapId, laps, history, maps, defaultItems, monsters, customItems]
  );
  const fmtBytes = (n) => (n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(2)}MB` : `${(n / 1024).toFixed(1)}KB`);

  const openExport = () => {
    setExportText(JSON.stringify(buildBackupPayload(), null, 2));
    setBackupMode("export");
    setBackupOpen(true);
    setBackupMessage("");
  };

  const openImport = () => {
    setImportText("");
    setBackupMode("import");
    setBackupOpen(true);
    setBackupMessage("");
  };

  const closeBackup = () => setBackupOpen(false);

  const downloadExport = () => {
    try {
      const blob = new Blob([exportText], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zeny-farm-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupMessage("Download started.");
    } catch (e) {
      setBackupMessage(`Download didn't work here (${e.message || e}) — copy the text below instead.`);
    }
  };

  // Artifacts run in a sandboxed iframe, where the modern Clipboard API is
  // often blocked outright (no clipboard-write permission delegated). Fall
  // back to the older selection + execCommand approach, which works in more
  // sandboxed contexts, before giving up and asking for a manual copy.
  const copyExportToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(exportText);
        setBackupMessage("Copied to clipboard.");
        return;
      }
      throw new Error("Clipboard API unavailable");
    } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = exportText;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) {
          setBackupMessage("Copied to clipboard.");
        } else {
          throw new Error("execCommand copy returned false");
        }
      } catch (e2) {
        setBackupMessage(
          "Clipboard copy is blocked in this environment — use Download Backup File instead, or select the text below and copy it manually (Ctrl/Cmd+C)."
        );
      }
    }
  };

  // Reading a file with FileReader avoids the paste/clipboard path entirely
  // (which is the most common failure point for very large backups), using
  // the same reliable path as the Download button.
  const handleImportFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportText(String(reader.result || ""));
      setBackupMessage(`Loaded ${file.name} — review below, then click Import & Replace.`);
    };
    reader.onerror = () => {
      setBackupMessage(`Couldn't read that file (${reader.error?.message || "unknown error"}).`);
    };
    reader.readAsText(file);
    e.target.value = ""; // allow re-selecting the same file later
  };

  const applyImport = async () => {
    let payload;
    try {
      payload = JSON.parse(importText);
    } catch (e) {
      setBackupMessage(`That doesn't look like valid JSON (${e.message}) — paste or upload the full exported backup.`);
      return;
    }
    if (!payload || typeof payload !== "object") {
      setBackupMessage("Invalid backup data — expected a backup object with session/history/maps.");
      return;
    }

    // Each field is applied and saved independently so one failure (e.g. a
    // field too large for a single storage write) doesn't silently block
    // everything else, and so we can report exactly what did and didn't
    // make it through instead of a generic failure message.
    const results = [];
    const trySave = async (label, key, value) => {
      try {
        await window.storage.set(key, JSON.stringify(value), false);
        results.push(`${label}: OK`);
      } catch (e) {
        results.push(`${label}: FAILED (${e.message || e})`);
      }
    };

    if (payload.session) {
      const s = payload.session;
      setItems(s.items || []);
      setExtraItems(s.extraItems || []);
      setCostItems(s.costItems || []);
      setActiveListTab(s.activeListTab || "main");
      setRunning(!!s.running);
      setStartedAt(s.startedAt || null);
      setAccumulated(s.accumulated || 0);
      setActiveMapId(s.activeMapId || null);
      setLaps(s.laps || []);
      await trySave("Session", SESSION_KEY, s);
    }
    if (Array.isArray(payload.history)) {
      const migrated = migrateHistory(payload.history);
      setHistory(migrated);
      await trySave("History", HISTORY_KEY, migrated);
    }
    if (Array.isArray(payload.maps)) {
      setMaps(payload.maps);
      await trySave("Maps", MAPS_KEY, payload.maps);
    }
    if (payload.defaultItems) {
      setDefaultItems(payload.defaultItems);
      await trySave("Default items", DEFAULT_ITEMS_KEY, payload.defaultItems);
    }
    if (Array.isArray(payload.monsters)) {
      setMonsters(payload.monsters);
      await trySave("Monsters", MONSTERS_KEY, payload.monsters);
    }
    if (Array.isArray(payload.customItems)) {
      setCustomItems(payload.customItems);
      await trySave("Custom items", CUSTOM_ITEMS_KEY, payload.customItems);
    }

    if (results.length === 0) {
      setBackupMessage("Nothing recognizable in that file — expected session/history/maps/monsters fields.");
    } else if (results.every((r) => r.endsWith("OK"))) {
      setBackupMessage(`Import complete — restored: ${results.map((r) => r.split(":")[0]).join(", ")}.`);
    } else {
      setBackupMessage(`Partial import — ${results.join(" · ")}`);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex justify-center px-4 py-8"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f6f7f9 100%)",
        color: "#242631",
        fontFamily: "'Segoe UI', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Swords size={26} color="#ff4b4b" strokeWidth={1.75} />
            <div>
              <h1
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  letterSpacing: "0.12em",
                  fontSize: "1.6rem",
                  color: "#dc3545",
                  textTransform: "uppercase",
                }}
              >
                Zeny Farm Tracker
              </h1>
              <p style={{ color: "#374151", fontSize: "0.8rem", letterSpacing: "0.03em" }}>
                Track your grind. Know your rate.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium"
              style={{ background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }}
              title="Export all your data as a backup file"
            >
              <Save size={12} />
              Export
            </button>
            <button
              onClick={openImport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium"
              style={{ background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }}
              title="Import a previously exported backup"
            >
              <MapPin size={12} />
              Import
            </button>
          </div>
        </div>

        {backupOpen && (
          <div className="rounded-lg p-4 mb-6" style={{ background: "#f3f4f6", border: "1px solid #ff4b4b" }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.14em", color: "#ff4b4b", textTransform: "uppercase" }}>
                {backupMode === "export" ? "Export Data" : "Import Data"}
              </span>
              <button onClick={closeBackup} style={{ color: "#374151" }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 pb-3" style={{ borderBottom: "1px solid #eef0f3" }}>
              {storageUsage.map((s) => {
                const pct = (s.bytes / STORAGE_KEY_LIMIT) * 100;
                return (
                  <div key={s.label} className="flex items-center gap-1.5" title={`${fmtBytes(s.bytes)} of 5MB limit`}>
                    <span style={{ fontSize: "0.66rem", color: "#4b5563" }}>{s.label}</span>
                    <span
                      style={{
                        fontSize: "0.66rem",
                        fontFamily: "ui-monospace, monospace",
                        color: pct > 80 ? "#dc3545" : pct > 50 ? "#ff4b4b" : "#ff4b4b",
                      }}
                    >
                      {fmtBytes(s.bytes)}
                    </span>
                  </div>
                );
              })}
            </div>

            {backupMode === "export" ? (
              <>
                <p style={{ fontSize: "0.72rem", color: "#4b5563", marginBottom: "0.75rem" }}>
                  This bundles your current session, maps, history, default items, and monster data into one backup.
                  Download it (or copy the text), then open your <strong>published</strong> artifact and use{" "}
                  <strong>Import</strong> there to bring everything over.
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={downloadExport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
                    style={{ background: "#ff4b4b", color: "#f3f4f6" }}
                  >
                    <Save size={14} />
                    Download Backup File
                  </button>
                  <button
                    onClick={copyExportToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
                    style={{ background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }}
                  >
                    Copy to Clipboard
                  </button>
                  {backupMessage && <span style={{ color: "#ff4b4b", fontSize: "0.78rem" }}>{backupMessage}</span>}
                </div>
                <textarea
                  readOnly
                  value={exportText}
                  rows={8}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-2.5 py-1.5 rounded-md outline-none text-xs"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #d1d5db",
                    color: "#374151",
                    fontFamily: "ui-monospace, monospace",
                    resize: "vertical",
                  }}
                />
              </>
            ) : (
              <>
                <p style={{ fontSize: "0.72rem", color: "#4b5563", marginBottom: "0.75rem" }}>
                  This will <strong>replace</strong> your current session, maps, history, default items, and
                  monster data here.
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportFileSelect}
                    style={{ display: "none" }}
                  />
                  <button
                    onClick={() => importFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
                    style={{ background: "#ff4b4b", color: "#f3f4f6" }}
                  >
                    <Save size={14} />
                    Upload Backup File
                  </button>
                  <span style={{ fontSize: "0.72rem", color: "#4b5563" }}>— most reliable option</span>
                </div>
                <p style={{ fontSize: "0.68rem", color: "#4b5563", marginBottom: "0.4rem" }}>
                  Or paste the backup text directly:
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={8}
                  placeholder="Paste exported backup JSON here..."
                  className="w-full px-2.5 py-1.5 rounded-md outline-none text-xs mb-3"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #d1d5db",
                    color: "#242631",
                    fontFamily: "ui-monospace, monospace",
                    resize: "vertical",
                  }}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={applyImport}
                    disabled={!importText.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
                    style={{ background: "#ff4b4b", color: "#242631" }}
                  >
                    <Save size={14} />
                    Import & Replace
                  </button>
                  {backupMessage && (
                    <span style={{ color: backupMessage.startsWith("Import complete") ? "#ff4b4b" : "#dc3545", fontSize: "0.78rem" }}>
                      {backupMessage}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {storageOk === false && (
          <div
            className="flex items-start gap-2.5 rounded-lg p-3 mb-6"
            style={{ background: "rgba(209,73,91,0.1)", border: "1px solid #dc3545" }}
          >
            <TriangleAlert size={16} color="#dc3545" style={{ flexShrink: 0, marginTop: "1px" }} />
            <div>
              <div style={{ color: "#991b1b", fontSize: "0.82rem", fontWeight: 600, marginBottom: "2px" }}>
                Storage isn't saving right now
              </div>
              <div style={{ color: "#7f1d1d", fontSize: "0.78rem", lineHeight: 1.4 }}>
                Nothing you do here will be saved when this page closes. This usually means the artifact hasn't
                been <strong>published</strong> yet — persistent storage only works on published artifacts. Publish
                it, then reload this page to reconnect.
              </div>
            </div>
          </div>
        )}

        {/* Map tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 flex-wrap">
            {maps.map((m) => (
              <div
                key={m.id}
                data-drag-map-id={m.id}
                className="flex items-center gap-1 rounded-t-md px-3 py-1.5 cursor-pointer"
                onClick={() => selectMap(m)}
                style={{
                  background: dragOverMapId === m.id ? "#e5e7eb" : activeMapId === m.id ? "#f3f4f6" : "#eef0f3",
                  border: `1px solid ${
                    dragOverMapId === m.id ? "#ff4b4b" : activeMapId === m.id ? "#ff4b4b" : "#d1d5db"
                  }`,
                  borderBottom: activeMapId === m.id ? "1px solid #f3f4f6" : "1px solid #d1d5db",
                  marginBottom: "-1px",
                  opacity: dragMapId === m.id ? 0.4 : 1,
                  transition: "background 0.1s ease, border-color 0.1s ease",
                }}
              >
                <div
                  onPointerDown={(e) => startMapDrag(e, m.id)}
                  style={{ color: "#4b5563", cursor: "grab", display: "flex", touchAction: "none" }}
                  title="Drag to reorder"
                >
                  <GripVertical size={12} />
                </div>
                <MapPin size={12} color={activeMapId === m.id ? "#ff4b4b" : "#4b5563"} />
                <span style={{ fontSize: "0.8rem", color: activeMapId === m.id ? "#dc3545" : "#4b5563" }}>
                  {m.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditMapForm(m);
                  }}
                  style={{ color: "#4b5563" }}
                  title="Edit map"
                >
                  <Pencil size={11} />
                </button>
              </div>
            ))}
            <button
              onClick={openNewMapForm}
              className="flex items-center gap-1 rounded-t-md px-3 py-1.5"
              style={{ background: "#eef0f3", border: "1px dashed #d1d5db", color: "#374151", fontSize: "0.8rem" }}
            >
              <Plus size={13} />
              New Map
            </button>
            <button
              onClick={openDefaultItemsForm}
              className="flex items-center gap-1 rounded-t-md px-3 py-1.5"
              style={{ background: "#eef0f3", border: "1px solid #d1d5db", color: "#4b5563", fontSize: "0.8rem" }}
              title="Set items that automatically pre-fill every new map you create"
            >
              <Pencil size={11} />
              Default Items
            </button>
          </div>
          <div style={{ height: "1px", background: "#d1d5db" }} />
        </div>

        {/* Map form */}
        {mapForm && (
          <div className="rounded-lg p-4 mb-6" style={{ background: "#f3f4f6", border: "1px solid #ff4b4b" }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.14em", color: "#dc3545", textTransform: "uppercase" }}>
                {mapForm.mode === "edit" ? "Edit Map" : "New Map"}
              </span>
              <button onClick={closeMapForm} style={{ color: "#374151" }}>
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-1 mb-3">
              <label style={{ fontSize: "0.68rem", color: "#374151" }}>Map name</label>
              <input
                value={mapForm.name}
                onChange={(e) => setMapForm({ ...mapForm, name: e.target.value })}
                placeholder="e.g. Geffen Dungeon 3"
                className="px-2.5 py-1.5 rounded-md outline-none text-sm"
                style={{ background: "#ffffff", border: "1px solid #d1d5db", color: "#242631" }}
              />
            </div>
            <div className="flex flex-col gap-1 mb-3">
              <label style={{ fontSize: "0.68rem", color: "#374151" }}>
                Main items &amp; sell price — one per line ("Item Name  Price")
              </label>
              <textarea
                value={mapForm.text}
                onChange={(e) => setMapForm({ ...mapForm, text: e.target.value })}
                rows={6}
                placeholder={"Blue Potion\t3720\nFire Wall\t1240\nSilver Robe\t4340"}
                className="px-2.5 py-1.5 rounded-md outline-none text-sm"
                style={{
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#242631",
                  fontFamily: "ui-monospace, monospace",
                  resize: "vertical",
                }}
              />
            </div>
            <div className="flex flex-col gap-1 mb-3">
              <label style={{ fontSize: "0.68rem", color: "#374151" }}>
                Extra items &amp; sell price — one per line (rare/bonus drops)
              </label>
              <textarea
                value={mapForm.extraText}
                onChange={(e) => setMapForm({ ...mapForm, extraText: e.target.value })}
                rows={4}
                placeholder={"Hand of God\t50000\nOld Card Album\t120000"}
                className="px-2.5 py-1.5 rounded-md outline-none text-sm"
                style={{
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#242631",
                  fontFamily: "ui-monospace, monospace",
                  resize: "vertical",
                }}
              />
              <span style={{ fontSize: "0.68rem", color: "#4b5563" }}>
                Paste straight from a spreadsheet column — tabs, commas, or spaces all work.
              </span>
            </div>
            <div className="flex flex-col gap-1 mb-3">
              <label style={{ fontSize: "0.68rem", color: "#374151" }}>
                Costs — one per line (potions, repairs, scrolls, etc. bought while farming here)
              </label>
              <textarea
                value={mapForm.costText || ""}
                onChange={(e) => setMapForm({ ...mapForm, costText: e.target.value })}
                rows={3}
                placeholder={"Fly Wing\t30\nAloe Vera\t750"}
                className="px-2.5 py-1.5 rounded-md outline-none text-sm"
                style={{
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#242631",
                  fontFamily: "ui-monospace, monospace",
                  resize: "vertical",
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveMapForm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
                style={{ background: "#ff4b4b", color: "#f3f4f6" }}
              >
                <Save size={14} />
                {mapForm.mode === "edit" ? "Save Changes" : "Create Map"}
              </button>
              {mapForm.mode === "edit" && (
                <button
                  onClick={() => deleteMap(mapForm.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
                  style={{ background: "#fef2f2", color: "#dc3545", border: "1px solid #dc3545" }}
                >
                  <Trash2 size={14} />
                  Delete Map
                </button>
              )}
            </div>
          </div>
        )}

        {/* Default items form */}
        {defaultItemsForm && (
          <div className="rounded-lg p-4 mb-6" style={{ background: "#f3f4f6", border: "1px solid #ff4b4b" }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.14em", color: "#ff4b4b", textTransform: "uppercase" }}>
                Default Items for New Maps
              </span>
              <button onClick={closeDefaultItemsForm} style={{ color: "#374151" }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: "0.72rem", color: "#4b5563", marginBottom: "0.75rem" }}>
              Whatever you set here automatically pre-fills the Main/Extras lists every time you click "New Map" —
              handy for items that show up on nearly every farming run (universal drops, common cards, etc.).
              You can still edit or clear them per map afterward.
            </p>

            <div className="mb-4 relative">
              <label style={{ fontSize: "0.68rem", color: "#374151", display: "block", marginBottom: "0.3rem" }}>
                Search to add an item (cards/equipment go to Extras automatically)
              </label>
              <div className="relative">
                <Search size={14} color="#4b5563" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  value={defaultItemQuery}
                  onChange={(e) => {
                    setDefaultItemQuery(e.target.value);
                    setDefaultItemDropdownOpen(true);
                  }}
                  onFocus={() => setDefaultItemDropdownOpen(true)}
                  placeholder="Search item name..."
                  className="w-full pl-8 pr-3 py-2 rounded-md outline-none text-sm"
                  style={{ background: "#ffffff", border: "1px solid #d1d5db", color: "#242631" }}
                />
                {defaultItemDropdownOpen && (
                  <div
                    className="absolute left-0 right-0 mt-1 rounded-md overflow-hidden z-10"
                    style={{ background: "#f3f4f6", border: "1px solid #d1d5db", maxHeight: "220px", overflowY: "auto" }}
                  >
                    {filteredDefaultItems.length === 0 ? (
                      <div className="px-3 py-3 text-center" style={{ color: "#4b5563", fontSize: "0.8rem" }}>
                        No matching items.
                      </div>
                    ) : (
                      filteredDefaultItems.map((it) => (
                        <div
                          key={it.name.toLowerCase()}
                          className="flex items-center justify-between px-3 py-2 cursor-pointer"
                          style={{ borderTop: "1px solid #eef0f3" }}
                          onClick={() => addItemToDefaults(it)}
                        >
                          <span style={{ fontSize: "0.85rem", color: "#242631" }}>{it.name}</span>
                          <span style={{ fontSize: "0.75rem", color: "#4b5563", fontFamily: "ui-monospace, monospace" }}>
                            {fmtZeny(it.sell)}z base
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {defaultItemDropdownOpen && (
                <div className="fixed inset-0" style={{ zIndex: 5 }} onClick={() => setDefaultItemDropdownOpen(false)} />
              )}
            </div>

            <div className="flex flex-col gap-1 mb-3">
              <label style={{ fontSize: "0.68rem", color: "#374151" }}>
                Default main items — one per line ("Item Name  Price")
              </label>
              <textarea
                value={defaultItemsForm.text}
                onChange={(e) => setDefaultItemsForm({ ...defaultItemsForm, text: e.target.value })}
                rows={5}
                placeholder={"Jellopy\t6"}
                className="px-2.5 py-1.5 rounded-md outline-none text-sm"
                style={{
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#242631",
                  fontFamily: "ui-monospace, monospace",
                  resize: "vertical",
                }}
              />
            </div>
            <div className="flex flex-col gap-1 mb-3">
              <label style={{ fontSize: "0.68rem", color: "#374151" }}>Default extra items — one per line</label>
              <textarea
                value={defaultItemsForm.extraText}
                onChange={(e) => setDefaultItemsForm({ ...defaultItemsForm, extraText: e.target.value })}
                rows={3}
                placeholder={"Old Card Album\t120000"}
                className="px-2.5 py-1.5 rounded-md outline-none text-sm"
                style={{
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#242631",
                  fontFamily: "ui-monospace, monospace",
                  resize: "vertical",
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveDefaultItemsForm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
                style={{ background: "#ff4b4b", color: "#242631" }}
              >
                <Save size={14} />
                Save Defaults
              </button>
            </div>
          </div>
        )}

        {/* Timer */}
        <div
          className="rounded-lg p-5 flex flex-col items-center justify-center mb-6"
          style={{
            background: "#f3f4f6",
            border: `1px solid ${running ? "#ff4b4b" : "#d1d5db"}`,
            boxShadow: running ? "0 0 24px -4px rgba(255,75,75,0.18)" : "none",
            transition: "all 0.3s ease",
            fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace",
          }}
        >
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.18em", color: "#374151", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Session Time
          </div>
          <div style={{ fontSize: "2.1rem", fontWeight: 600, color: running ? "#ff4b4b" : "#31333f", letterSpacing: "0.02em" }}>
            {fmtTime(elapsedMs)}
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            {["h", "m", "s"].map((field) => (
              <div key={field} className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={msToHMS(elapsedMs)[field]}
                  onChange={(e) => updateSessionTime(field, e.target.value)}
                  className="px-2 py-1 rounded-md outline-none text-sm text-center"
                  style={{ width: "52px", background: "#ffffff", border: "1px solid #d1d5db", color: "#242631" }}
                />
                <span style={{ fontSize: "0.7rem", color: "#4b5563" }}>{field}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {[10, 20, 30].map((minutes) => (
              <button
                key={minutes}
                onClick={() => addTimerMinutes(minutes)}
                className="px-3 py-1.5 rounded-md text-sm font-medium"
                style={{ background: "#ffffff", color: "#ff4b4b", border: "1px solid #ff4b4b" }}
              >
                +{minutes} min
              </button>
            ))}
            <button
              onClick={toggleTimer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
              style={{ background: running ? "#dc3545" : "#ff4b4b", color: running ? "#fff" : "#f3f4f6" }}
            >
              {running ? <Pause size={14} /> : <Play size={14} />}
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={addLap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
              style={{ background: "#eef0f3", color: "#ff4b4b", border: "1px solid #ff4b4b" }}
            >
              <Flag size={14} />
              Lap
            </button>
            <button
              onClick={resetTimer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
              style={{ background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }}
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          {laps.length > 0 && (
            <div className="w-full mt-4" style={{ borderTop: "1px solid #eef0f3", paddingTop: "0.75rem" }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "0.62rem", letterSpacing: "0.14em", color: "#374151", textTransform: "uppercase" }}>
                  Laps ({laps.length})
                </span>
                <button onClick={clearLaps} style={{ fontSize: "0.68rem", color: "#4b5563" }}>
                  Clear
                </button>
              </div>
              <div className="flex flex-col gap-1" style={{ maxHeight: "160px", overflowY: "auto" }}>
                {laps.map((lap, idx) => {
                  const prevMs = idx === 0 ? 0 : laps[idx - 1].ms;
                  const split = lap.ms - prevMs;
                  return (
                    <div
                      key={lap.id}
                      className="flex items-center justify-between px-2 py-1 rounded"
                      style={{ background: idx % 2 === 0 ? "transparent" : "#f8fafc", fontSize: "0.78rem" }}
                    >
                      <span style={{ color: "#4b5563", width: "48px" }}>Lap {idx + 1}</span>
                      <span style={{ color: "#242631" }}>{fmtTime(lap.ms)}</span>
                      <span style={{ color: "#ff4b4b" }}>+{fmtTime(split)}</span>
                      <button onClick={() => removeLap(lap.id)} style={{ color: "#dc3545" }} title="Remove lap">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {activeListTab === "costs" && (
          <div
            className="rounded-lg p-3 mb-4"
            style={{ background: "#f3f4f6", border: "1px solid #d1d5db", color: "#4b5563", fontSize: "0.78rem" }}
          >
            Monster drop search isn't available for Costs — but you can still search for a known item below, or add
            what you spent manually (potions bought, repairs, teleport scrolls, etc.).
          </div>
        )}
        {activeListTab !== "costs" && (
          <>
            {/* Monster search - add drops to the active list */}
            <div className="mb-4 relative">
              <div style={{ fontSize: "0.65rem", letterSpacing: "0.18em", color: "#374151", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Add Monster Drops to {activeListTab === "main" ? "Main" : "Extras"}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} color="#4b5563" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    value={monsterQuery}
                    onChange={(e) => {
                      setMonsterQuery(e.target.value);
                      setMonsterDropdownOpen(true);
                    }}
                    onFocus={() => setMonsterDropdownOpen(true)}
                    placeholder="Search monster name..."
                    className="w-full pl-8 pr-3 py-2 rounded-md outline-none text-sm"
                    style={{ background: "#ffffff", border: "1px solid #d1d5db", color: "#242631" }}
                  />
                  {monsterDropdownOpen && (
                    <div
                      className="absolute left-0 right-0 mt-1 rounded-md overflow-hidden z-10"
                      style={{ background: "#f3f4f6", border: "1px solid #d1d5db", maxHeight: "260px", overflowY: "auto" }}
                    >
                      {filteredMonsters.length === 0 ? (
                        <div className="px-3 py-3 text-center" style={{ color: "#4b5563", fontSize: "0.8rem" }}>
                          No monsters found.
                        </div>
                      ) : (
                        <>
                          {filteredMonsters.length === 40 && (
                            <div
                              className="px-3 py-1.5 text-center"
                              style={{ color: "#4b5563", fontSize: "0.68rem", borderBottom: "1px solid #eef0f3" }}
                            >
                              Showing first 40 — keep typing to narrow it down
                            </div>
                          )}
                          {filteredMonsters.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between px-3 py-2 cursor-pointer"
                              style={{ borderTop: "1px solid #eef0f3" }}
                              onClick={() => addMonsterDropsToActiveList(m)}
                            >
                              <div>
                                <div style={{ fontSize: "0.85rem", color: "#242631" }}>{m.name}</div>
                                <div style={{ fontSize: "0.68rem", color: "#4b5563" }}>
                                  {m.items
                                    .slice(0, 6)
                                    .map((it) => it.name)
                                    .join(", ")}
                                  {m.items.length > 6 ? ", …" : ""}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditMonsterForm(m);
                                }}
                                style={{ color: "#4b5563", flexShrink: 0, marginLeft: "0.5rem" }}
                                title="Edit monster"
                              >
                                <Pencil size={12} />
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={openNewMonsterForm}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium"
                  style={{ background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }}
                >
                  <Plus size={14} />
                  New Monster
                </button>
              </div>
              {monsterDropdownOpen && (
                <div className="fixed inset-0" style={{ zIndex: 5 }} onClick={() => setMonsterDropdownOpen(false)} />
              )}
            </div>
          </>
        )}

        {/* Item search - add a single known item to the active list (available on all tabs, including Costs) */}
        <div className="mb-6 relative">
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.18em", color: "#374151", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Add Single Item to {activeListTab === "main" ? "Main" : activeListTab === "extras" ? "Extras" : "Costs"}
          </div>
          <div className="relative">
            <Search size={14} color="#4b5563" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={itemQuery}
              onChange={(e) => {
                setItemQuery(e.target.value);
                setItemDropdownOpen(true);
              }}
              onFocus={() => setItemDropdownOpen(true)}
              placeholder="Search item name..."
              className="w-full pl-8 pr-3 py-2 rounded-md outline-none text-sm"
              style={{ background: "#ffffff", border: "1px solid #d1d5db", color: "#242631" }}
            />
            {itemDropdownOpen && (
              <div
                className="absolute left-0 right-0 mt-1 rounded-md overflow-hidden z-10"
                style={{ background: "#f3f4f6", border: "1px solid #d1d5db", maxHeight: "260px", overflowY: "auto" }}
              >
                {filteredItems.length === 0 ? (
                  <div className="px-3 py-3 text-center" style={{ color: "#4b5563", fontSize: "0.8rem" }}>
                    No matching items. You can still add it manually below.
                  </div>
                ) : (
                  filteredItems.map((it) => (
                    <div
                      key={it.name.toLowerCase()}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer"
                      style={{ borderTop: "1px solid #eef0f3" }}
                      onClick={() => addItemToList(it)}
                    >
                      <span style={{ fontSize: "0.85rem", color: "#242631" }}>{it.name}</span>
                      <span style={{ fontSize: "0.75rem", color: "#4b5563", fontFamily: "ui-monospace, monospace" }}>
                        {fmtZeny(it.sell)}z base
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {itemDropdownOpen && (
            <div className="fixed inset-0" style={{ zIndex: 5 }} onClick={() => setItemDropdownOpen(false)} />
          )}
        </div>

        {/* Monster form */}
        {monsterForm && (
          <div className="rounded-lg p-4 mb-6" style={{ background: "#f3f4f6", border: "1px solid #ff4b4b" }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.14em", color: "#dc3545", textTransform: "uppercase" }}>
                {monsterForm.mode === "edit" ? "Edit Monster" : "New Monster"}
              </span>
              <button onClick={closeMonsterForm} style={{ color: "#374151" }}>
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-1 mb-3">
              <label style={{ fontSize: "0.68rem", color: "#374151" }}>Monster name</label>
              <input
                value={monsterForm.name}
                onChange={(e) => setMonsterForm({ ...monsterForm, name: e.target.value })}
                placeholder="e.g. Deviruchi"
                className="px-2.5 py-1.5 rounded-md outline-none text-sm"
                style={{ background: "#ffffff", border: "1px solid #d1d5db", color: "#242631" }}
              />
            </div>
            <div className="flex flex-col gap-1 mb-3">
              <label style={{ fontSize: "0.68rem", color: "#374151" }}>
                Drop items &amp; sell price — one per line ("Item Name  Price")
              </label>
              <textarea
                value={monsterForm.text}
                onChange={(e) => setMonsterForm({ ...monsterForm, text: e.target.value })}
                rows={6}
                placeholder={"Zargon\t240\nLittle Evil Horn\t264\nLittle Evil Wing\t1000"}
                className="px-2.5 py-1.5 rounded-md outline-none text-sm"
                style={{
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#242631",
                  fontFamily: "ui-monospace, monospace",
                  resize: "vertical",
                }}
              />
              <span style={{ fontSize: "0.68rem", color: "#4b5563" }}>
                Paste straight from a spreadsheet column — tabs, commas, or spaces all work.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveMonsterForm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
                style={{ background: "#ff4b4b", color: "#f3f4f6" }}
              >
                <Save size={14} />
                {monsterForm.mode === "edit" ? "Save Changes" : "Create Monster"}
              </button>
              {monsterForm.mode === "edit" && (
                <button
                  onClick={() => deleteMonster(monsterForm.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
                  style={{ background: "#fef2f2", color: "#dc3545", border: "1px solid #dc3545" }}
                >
                  <Trash2 size={14} />
                  Delete Monster
                </button>
              )}
            </div>
          </div>
        )}

        {/* Items table */}
        <div className="flex items-center justify-between gap-2 mb-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            {[
              { key: "main", label: "Main" },
              { key: "extras", label: "Extras" },
            ].map((tab) => (
              <button
                key={tab.key}
                data-drag-tab={tab.key}
                onClick={() => setActiveListTab(tab.key)}
                className="rounded-t-md px-4 py-1.5 text-sm"
                style={{
                  background: dragOverTab === tab.key ? "#e5e7eb" : activeListTab === tab.key ? "#f3f4f6" : "#eef0f3",
                  border: `1px solid ${
                    dragOverTab === tab.key ? "#ff4b4b" : activeListTab === tab.key ? "#ff4b4b" : "#d1d5db"
                  }`,
                  borderBottom: activeListTab === tab.key ? "1px solid #f3f4f6" : "1px solid #d1d5db",
                  color: activeListTab === tab.key ? "#dc3545" : "#4b5563",
                  marginBottom: "-1px",
                  transition: "background 0.1s ease, border-color 0.1s ease",
                }}
              >
                {tab.label}
                {dragItemId && dragSourceTab !== tab.key && (
                  <span style={{ fontSize: "0.62rem", color: "#ff4b4b", marginLeft: "0.35rem" }}>drop here</span>
                )}
              </button>
            ))}
            <button
              onClick={() => setActiveListTab("costs")}
              className="rounded-t-md px-4 py-1.5 text-sm"
              style={{
                background: activeListTab === "costs" ? "#f3f4f6" : "#eef0f3",
                border: `1px solid ${activeListTab === "costs" ? "#dc3545" : "#d1d5db"}`,
                borderBottom: activeListTab === "costs" ? "1px solid #f3f4f6" : "1px solid #d1d5db",
                color: activeListTab === "costs" ? "#991b1b" : "#4b5563",
                marginBottom: "-1px",
                transition: "background 0.1s ease, border-color 0.1s ease",
              }}
              title="Track zeny spent while farming — deducted from your Main total and Zeny/Hr"
            >
              Costs
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={sortActiveListByName}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium mb-1"
              style={{ background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }}
              disabled={getActiveList().length === 0}
              title="Sort items alphabetically by name"
            >
              {nameSortDir === "asc" ? <ArrowUp size={14} /> : nameSortDir === "desc" ? <ArrowDown size={14} /> : <ArrowUpDown size={14} />}
              Sort by Name
            </button>
            <button
              onClick={sortActiveListByCategory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium mb-1"
              style={{ background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }}
              disabled={getActiveList().length === 0}
              title="Sort by Use, then Equip, then Misc"
            >
              <ArrowUpDown size={14} />
              Sort by Type
            </button>
          </div>
        </div>
        {bulkSelectedIds.length > 0 && (
          <div
            className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 mb-2 flex-wrap"
            style={{ background: "#f3f4f6", border: "1px solid #ff4b4b" }}
          >
            <span style={{ fontSize: "0.8rem", color: "#374151" }}>
              {bulkSelectedIds.length} item{bulkSelectedIds.length === 1 ? "" : "s"} selected
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {activeListTab !== "extras" && (
                <button
                  onClick={() => bulkMoveSelected("extras")}
                  className="px-2.5 py-1 rounded-md text-xs font-medium"
                  style={{ background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }}
                >
                  Move to Extras
                </button>
              )}
              {activeListTab !== "main" && (
                <button
                  onClick={() => bulkMoveSelected("main")}
                  className="px-2.5 py-1 rounded-md text-xs font-medium"
                  style={{ background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }}
                >
                  Move to Main
                </button>
              )}
              {activeListTab !== "costs" && (
                <button
                  onClick={() => bulkMoveSelected("costs")}
                  className="px-2.5 py-1 rounded-md text-xs font-medium"
                  style={{ background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }}
                >
                  Move to Costs
                </button>
              )}
              <button
                onClick={bulkDeleteSelected}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
                style={{ background: "#fef2f2", color: "#dc3545", border: "1px solid #dc3545" }}
              >
                <Trash2 size={12} />
                Delete Selected
              </button>
              <button
                onClick={() => setBulkSelectedIds([])}
                className="text-xs"
                style={{ color: "#4b5563" }}
              >
                Clear
              </button>
            </div>
          </div>
        )}
        <div className="rounded-lg overflow-hidden mb-3" style={{ background: "#f3f4f6", border: "1px solid #d1d5db" }}>
          {getActiveList().length === 0 ? (
            <div className="px-4 py-6 text-center" style={{ color: "#4b5563", fontSize: "0.85rem" }}>
              {activeListTab === "main"
                ? "Pick a map above to load its item list, or add items manually below."
                : activeListTab === "extras"
                ? "No extra items yet — add rare or bonus drops here."
                : "No costs logged yet — add what you spent while farming (potions, repairs, scrolls, etc.)."}
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#eef0f3" }}>
                  <th className="px-2 py-1 text-center" style={{ width: "24px" }}>
                    <input
                      type="checkbox"
                      checked={bulkSelectedIds.length > 0 && bulkSelectedIds.length === getActiveList().length}
                      onChange={toggleBulkSelectAll}
                      title="Select all"
                      style={{ width: "13px", height: "13px", accentColor: "#ff4b4b", cursor: "pointer" }}
                    />
                  </th>
                  <th className="px-2 py-1" style={{ width: "28px" }} />
                  <th
                    className="text-left px-4 py-1"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "#374151", textTransform: "uppercase", fontWeight: 500 }}
                  >
                    Item
                  </th>
                  <th
                    className="text-left px-3 py-1"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "#374151", textTransform: "uppercase", fontWeight: 500, width: "90px" }}
                  >
                    Qty
                  </th>
                  <th
                    className="text-left px-3 py-1"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "#374151", textTransform: "uppercase", fontWeight: 500, width: "110px" }}
                  >
                    {activeListTab === "costs" ? "Cost" : "Sell"}
                  </th>
                  <th
                    className="text-left px-3 py-1"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "#374151", textTransform: "uppercase", fontWeight: 500, width: "120px" }}
                  >
                    Total
                  </th>
                  <th
                    className="text-left px-3 py-1"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "#374151", textTransform: "uppercase", fontWeight: 500, width: "70px" }}
                  >
                    {activeListTab === "costs" ? "" : "Type"}
                  </th>
                  <th className="px-2 py-1" style={{ width: "34px" }} title={activeListTab === "costs" ? undefined : "Tally this item's quantity into Tracked Count"}>
                    {activeListTab === "costs" ? null : <Skull size={13} color="#4b5563" />}
                  </th>
                  <th className="px-3 py-1" style={{ width: "36px" }} />
                </tr>
              </thead>
              <tbody>
                {getActiveList().map((it, idx) => (
                  <tr
                    key={it.id}
                    data-drag-item-id={it.id}
                    style={{
                      background:
                        dragOverItemId === it.id
                          ? "#e5e7eb"
                          : dragItemId === it.id
                          ? "#eef0f3"
                          : idx % 2 === 0
                          ? "transparent"
                          : "#f8fafc",
                      borderTop: dragOverItemId === it.id ? "2px solid #ff4b4b" : "1px solid #eef0f3",
                      opacity: dragItemId === it.id ? 0.5 : 1,
                    }}
                  >
                    <td className="px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={bulkSelectedIds.includes(it.id)}
                        onChange={() => toggleBulkSelect(it.id)}
                        style={{ width: "13px", height: "13px", accentColor: "#ff4b4b", cursor: "pointer" }}
                      />
                    </td>
                    <td className="px-2 py-1">
                      {activeListTab === "costs" ? null : (
                        <div
                          onPointerDown={(e) => startDrag(e, it.id)}
                          onTouchStart={(e) => startDrag(e, it.id)}
                          style={{ cursor: "grab", touchAction: "none", color: "#4b5563" }}
                          title="Drag to reorder or move to Extras"
                        >
                          <GripVertical size={15} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-1">
                      <div className="flex items-center gap-2">
                        <input
                          value={it.name}
                          onChange={(e) => updateItem(it.id, "name", e.target.value)}
                          placeholder="Item name"
                          title={itemIdFor(it.name) ? `Item ID #${itemIdFor(it.name)}` : undefined}
                          className="bg-transparent outline-none w-full"
                          style={{ color: "#242631", fontSize: "0.85rem" }}
                        />
                        {it.name.trim() && activeListTab !== "costs" && (
                          <select
                            value={it.type || "misc"}
                            onChange={(e) => updateItem(it.id, "type", e.target.value)}
                            title="Item type"
                            style={{
                              fontSize: "0.62rem",
                              letterSpacing: "0.02em",
                              color: "#4b5563",
                              background: "#ffffff",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              padding: "1px 3px",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                              outline: "none",
                            }}
                          >
                            <option value="equip">Equip</option>
                            <option value="use">Use</option>
                            <option value="misc">Msc</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-1">
                      <input
                        ref={(el) => (qtyInputRefs.current[idx] = el)}
                        type="number"
                        min="0"
                        value={it.qty === 0 ? "" : it.qty}
                        onChange={(e) => updateItem(it.id, "qty", parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key !== "Tab") return;
                          const list = getActiveList();
                          const nextIdx = e.shiftKey ? idx - 1 : idx + 1;
                          if (nextIdx >= 0 && nextIdx < list.length) {
                            e.preventDefault();
                            qtyInputRefs.current[nextIdx]?.focus();
                            qtyInputRefs.current[nextIdx]?.select();
                          }
                        }}
                        placeholder="0"
                        className="bg-transparent outline-none w-full"
                        style={{ color: "#242631", fontFamily: "ui-monospace, monospace", fontSize: "0.85rem" }}
                      />
                    </td>
                    <td className="px-3 py-1">
                      <input
                        type="number"
                        min="0"
                        value={it.sell === 0 ? "" : it.sell}
                        onChange={(e) => updateItem(it.id, "sell", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="bg-transparent outline-none w-full"
                        style={{ color: "#374151", fontFamily: "ui-monospace, monospace", fontSize: "0.85rem" }}
                      />
                    </td>
                    <td
                      className="px-3 py-1"
                      style={{
                        fontFamily: "ui-monospace, monospace",
                        color: activeListTab === "costs" ? "#dc3545" : "#dc3545",
                        fontSize: "0.85rem",
                      }}
                    >
                      {activeListTab === "costs" ? "-" : ""}
                      {fmtZeny((it.qty || 0) * (it.sell || 0))}
                    </td>
                    <td className="px-3 py-1">
                      {activeListTab === "costs" ? null : (
                        <button
                          onClick={() => toggleSellType(it.id)}
                          title="Toggle between vending to players and selling to NPC"
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={
                            it.sellType === "npc"
                              ? { background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }
                              : { background: "rgba(255,75,75,0.15)", color: "#ff4b4b", border: "1px solid #ff4b4b" }
                          }
                        >
                          {it.sellType === "npc" ? "NPC" : "Vend"}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-1 text-center">
                      {activeListTab === "costs" ? null : (
                        <input
                          type="checkbox"
                          checked={!!it.count}
                          onChange={() => toggleItemCount(it.id)}
                          title="Tally this item's quantity into Tracked Count"
                          style={{ width: "15px", height: "15px", accentColor: "#dc3545", cursor: "pointer" }}
                        />
                      )}
                    </td>
                    <td className="px-3 py-1">
                      <button onClick={() => removeItem(it.id)} style={{ color: "#dc3545" }} title="Remove">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#eef0f3", borderTop: "1px solid #d1d5db" }}>
                  <td className="px-2 py-1.5" />
                  <td className="px-2 py-1.5" />
                  <td className="px-4 py-1.5" style={{ fontSize: "0.8rem", letterSpacing: "0.06em", color: "#242631", fontWeight: 600 }}>
                    {activeListTab === "main" ? "Main Total" : activeListTab === "extras" ? "Extras Total" : "Total Costs"}
                  </td>
                  <td className="px-3 py-1.5" />
                  <td className="px-3 py-1.5" />
                  <td
                    className="px-3 py-1.5"
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      color: activeListTab === "costs" ? "#dc3545" : "#dc3545",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  >
                    {activeListTab === "costs" ? "-" : ""}
                    {fmtZeny(getActiveList().reduce((sum, it) => sum + (it.qty || 0) * (it.sell || 0), 0))}
                  </td>
                  <td className="px-3 py-1.5" />
                  <td className="px-3 py-1.5" />
                  <td className="px-3 py-1.5" />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={addBlankItem}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }}
          >
            <Plus size={14} />
            {activeListTab === "costs" ? "Add Cost" : `Add Item to ${activeListTab === "main" ? "Main" : "Extras"}`}
          </button>
          <button
            onClick={openSaveCurrentAsMapForm}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ background: "#eef0f3", color: "#374151", border: "1px solid #d1d5db" }}
            disabled={items.length === 0 && extraItems.length === 0}
          >
            <MapPin size={14} />
            Save List as New Map
          </button>
          {activeMapId && (
            <button
              onClick={updateActiveMap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
              style={{ background: "#eef0f3", color: "#ff4b4b", border: "1px solid #ff4b4b" }}
              title="Save the current Main/Extras lists back into this map"
            >
              <Save size={14} />
              Update Map
            </button>
          )}
          {mapUpdateFlash && <span style={{ color: "#ff4b4b", fontSize: "0.8rem", alignSelf: "center" }}>Map updated.</span>}
        </div>

        {/* Main + Extra + Zeny/Hour + Tracked Count */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace" }}
        >
          <div className="rounded-lg p-5 flex flex-col justify-center" style={{ background: "#f3f4f6", border: "1px solid #d1d5db" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Coins size={13} color="#ff4b4b" />
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.18em", color: "#374151", textTransform: "uppercase" }}>
                Main
              </span>
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 600, color: "#dc3545" }}>{fmtZeny(grandTotal)} z</div>
            <div style={{ fontSize: "0.72rem", color: "#374151", marginTop: "0.15rem" }}>
              {totalCosts > 0 ? (
                <span>
                  {fmtZeny(mainGross)}z gross <span style={{ color: "#dc3545" }}>− {fmtZeny(totalCosts)}z costs</span>
                </span>
              ) : (
                `${items.length} item${items.length === 1 ? "" : "s"} on list`
              )}
            </div>
          </div>

          <div className="rounded-lg p-5 flex flex-col justify-center" style={{ background: "#f3f4f6", border: "1px solid #d1d5db" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Coins size={13} color="#ff4b4b" />
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.18em", color: "#374151", textTransform: "uppercase" }}>
                Extra
              </span>
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 600, color: "#ff4b4b" }}>{fmtZeny(extraGross)} z</div>
            <div style={{ fontSize: "0.72rem", color: "#374151", marginTop: "0.15rem" }}>
              {extraGross > 0
                ? `bonus — not counted in Zeny/Hr (combined: ${fmtZeny(combinedTotal)}z)`
                : `${extraItems.length} item${extraItems.length === 1 ? "" : "s"} on list`}
            </div>
          </div>

          <div className="rounded-lg p-5 flex flex-col justify-center" style={{ background: "#f3f4f6", border: "1px solid #d1d5db" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={13} color="#ff4b4b" />
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.18em", color: "#374151", textTransform: "uppercase" }}>
                Zeny / Hour
              </span>
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 600, color: "#ff4b4b" }}>
              {hours > 0.0005 ? `${fmtZeny(zenyPerHour)} z` : "—"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#374151", marginTop: "0.15rem" }}>
              {hours > 0.0005 ? `Main only, ${fmtTime(elapsedMs)} elapsed` : "start the timer to calculate"}
            </div>
          </div>

          <div className="rounded-lg p-5 flex flex-col justify-center" style={{ background: "#f3f4f6", border: "1px solid #d1d5db" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Skull size={13} color="#dc3545" />
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.18em", color: "#374151", textTransform: "uppercase" }}>
                Tracked Count
              </span>
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 600, color: "#dc3545" }}>
              {trackedItemNames.length > 0 ? fmtZeny(trackedCount) : "—"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#374151", marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {trackedItemNames.length > 0 ? `sum of: ${trackedItemNames.join(", ")}` : "check items to tally their quantity"}
            </div>
          </div>
        </div>

        {/* End session */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={endSession}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
            style={{ background: "#ff4b4b", color: "#242631" }}
          >
            <Save size={15} />
            End Session &amp; Save to History
          </button>
          {saveFlash && <span style={{ color: "#ff4b4b", fontSize: "0.8rem" }}>Session saved.</span>}
        </div>

        {/* History */}
        <div className="rounded-lg" style={{ background: "#f3f4f6", border: "1px solid #d1d5db" }}>
          <button onClick={() => setHistoryOpen(!historyOpen)} className="w-full flex items-center justify-between px-4 py-3">
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.14em", color: "#374151", textTransform: "uppercase" }}>
              Session History ({history.length})
            </span>
            {historyOpen ? <ChevronUp size={16} color="#374151" /> : <ChevronDown size={16} color="#374151" />}
          </button>
          {historyOpen && (
            <div className="flex items-center gap-2 px-4 py-2 flex-wrap" style={{ borderTop: "1px solid #eef0f3" }}>
              <div className="relative flex-1" style={{ minWidth: "160px" }}>
                <Search size={13} color="#4b5563" style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  value={historySearch}
                  onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                  placeholder="Search by map or notes..."
                  className="w-full pl-7 pr-2 py-1.5 rounded-md outline-none text-sm"
                  style={{ background: "#ffffff", border: "1px solid #d1d5db", color: "#242631" }}
                />
              </div>
              <div className="flex items-center rounded-md overflow-hidden" style={{ border: "1px solid #d1d5db" }}>
                {[
                  { key: "all", label: "All" },
                  { key: "today", label: "Today" },
                  { key: "7d", label: "7d" },
                  { key: "30d", label: "30d" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setHistoryDateFilter(opt.key); setHistoryPage(1); }}
                    className="px-2.5 py-1.5 text-xs font-medium"
                    style={{
                      background: historyDateFilter === opt.key ? "#ff4b4b" : "#eef0f3",
                      color: historyDateFilter === opt.key ? "#f3f4f6" : "#4b5563",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {(historySearch.trim() || historyDateFilter !== "all") && (
                <span style={{ fontSize: "0.72rem", color: "#4b5563" }}>
                  {filteredHistory.length} of {history.length}
                </span>
              )}
            </div>
          )}
          {historyOpen && combineSelectedIds.length > 0 && (
            <div
              className="flex items-center justify-between gap-2 px-4 py-2 flex-wrap"
              style={{ borderTop: "1px solid #eef0f3", background: "#f3f4f6" }}
            >
              <span style={{ fontSize: "0.78rem", color: "#374151" }}>
                {combineSelectedIds.length} session{combineSelectedIds.length === 1 ? "" : "s"} selected
                {combineValidation.reason && (
                  <span style={{ color: "#dc3545", marginLeft: "0.5rem" }}>— {combineValidation.reason}</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={combineSessions}
                  disabled={!combineValidation.valid}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
                  style={
                    combineValidation.valid
                      ? { background: "#ff4b4b", color: "#242631" }
                      : { background: "#eef0f3", color: "#4b5563", border: "1px solid #d1d5db" }
                  }
                >
                  <Save size={13} />
                  Combine Selected
                </button>
                <button
                  onClick={() => setCombineSelectedIds([])}
                  className="text-xs"
                  style={{ color: "#4b5563" }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          {historyOpen && (
            <div style={{ borderTop: "1px solid #eef0f3" }}>
              {history.length === 0 ? (
                <div className="px-4 py-5 text-center" style={{ color: "#4b5563", fontSize: "0.85rem" }}>
                  No completed sessions yet.
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="px-4 py-5 text-center" style={{ color: "#4b5563", fontSize: "0.85rem" }}>
                  No sessions match that search/filter.
                </div>
              ) : (
                visibleHistory.map((h) => {
                  const expanded = expandedHistoryId === h.id;
                  const total = historyTotal(h);
                  const zph = historyZenyPerHour(h);
                  const hms = msToHMS(h.durationMs);
                  const isSelected = combineSelectedIds.includes(h.id);
                  return (
                    <div key={h.id} style={{ borderTop: "1px solid #eef0f3" }}>
                      <div
                        onClick={() => toggleHistoryExpand(h.id)}
                        className="flex items-center justify-between px-4 py-2.5 gap-2 cursor-pointer"
                        style={{ fontSize: "0.82rem" }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleCombineSelect(h.id)}
                          title="Select to combine with other sessions from the same map"
                          style={{ width: "14px", height: "14px", accentColor: "#ff4b4b", cursor: "pointer", flexShrink: 0 }}
                        />
                        <div style={{ color: "#374151", minWidth: "150px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          {fmtDateTime(h.date)}
                          {h.combinedFrom && h.combinedFrom.length > 1 && (
                            <span
                              title={`Combined from ${h.combinedFrom.length} sessions`}
                              style={{
                                fontSize: "0.6rem",
                                letterSpacing: "0.04em",
                                color: "#ff4b4b",
                                border: "1px solid #ff4b4b",
                                borderRadius: "4px",
                                padding: "1px 4px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Combined
                            </span>
                          )}
                        </div>
                        <div style={{ color: "#4b5563", flex: 1 }}>{h.mapName || "—"}</div>
                        <div style={{ fontFamily: "ui-monospace, monospace", color: "#242631" }}>{fmtTime(h.durationMs)}</div>
                        <div style={{ fontFamily: "ui-monospace, monospace", color: "#dc3545" }}>{fmtZeny(total)} z</div>
                        {historyExtraGross(h) > 0 && (
                          <div
                            title="Extra (bonus) zeny — not included in the total or z/hr"
                            style={{ fontFamily: "ui-monospace, monospace", color: "#ff4b4b", fontSize: "0.72rem" }}
                          >
                            +{fmtZeny(historyExtraGross(h))} extra
                          </div>
                        )}
                        <div style={{ fontFamily: "ui-monospace, monospace", color: "#ff4b4b" }}>{fmtZeny(zph)} z/hr</div>
                        {h.notes && h.notes.trim() && <StickyNote size={12} color="#ff4b4b" title={h.notes} />}
                        <Pencil size={12} color="#4b5563" />
                        {expanded ? <ChevronUp size={14} color="#4b5563" /> : <ChevronDown size={14} color="#4b5563" />}
                      </div>

                      {expanded && (
                        <div className="px-4 pb-4" style={{ background: "#f3f4f6" }}>
                          {/* Duration editor */}
                          <div className="flex items-center gap-2 mb-3 pt-1">
                            <span style={{ fontSize: "0.65rem", letterSpacing: "0.1em", color: "#374151", textTransform: "uppercase" }}>
                              Duration
                            </span>
                            {["h", "m", "s"].map((field) => (
                              <div key={field} className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={hms[field]}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => updateHistoryDuration(h.id, field, e.target.value)}
                                  className="px-2 py-1 rounded-md outline-none text-sm"
                                  style={{
                                    width: "56px",
                                    background: "#ffffff",
                                    border: "1px solid #d1d5db",
                                    color: "#242631",
                                    fontFamily: "ui-monospace, monospace",
                                  }}
                                />
                                <span style={{ fontSize: "0.7rem", color: "#4b5563" }}>{field}</span>
                              </div>
                            ))}
                          </div>

                          {h.combinedFrom && h.combinedFrom.length > 1 && (
                            <div className="mb-3">
                              <span style={{ fontSize: "0.65rem", letterSpacing: "0.1em", color: "#374151", textTransform: "uppercase" }}>
                                Combined from {h.combinedFrom.length} sessions
                              </span>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {h.combinedFrom.map((ts, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      fontSize: "0.72rem",
                                      color: "#374151",
                                      background: "#f3f4f6",
                                      border: "1px solid #d1d5db",
                                      borderRadius: "4px",
                                      padding: "2px 6px",
                                      fontFamily: "ui-monospace, monospace",
                                    }}
                                  >
                                    {fmtDateTime(ts)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mb-3">
                            <label style={{ fontSize: "0.65rem", letterSpacing: "0.1em", color: "#374151", textTransform: "uppercase", display: "block", marginBottom: "0.3rem" }}>
                              Notes
                            </label>
                            <textarea
                              value={h.notes || ""}
                              onChange={(e) => updateHistoryNotes(h.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="e.g. used food buffs, party farmed, etc."
                              rows={2}
                              className="w-full px-2.5 py-1.5 rounded-md outline-none text-sm"
                              style={{
                                background: "#ffffff",
                                border: "1px solid #d1d5db",
                                color: "#242631",
                                resize: "vertical",
                              }}
                            />
                          </div>

                          {/* Item editors: Main, Extra (bonus), Costs */}
                          {renderHistoryItemTable({
                            h,
                            listKey: "items",
                            title: "Main Items",
                            accentColor: "#ff4b4b",
                            addLabel: "Add Main Item",
                          })}
                          {renderHistoryItemTable({
                            h,
                            listKey: "extraItems",
                            title: "Extra Items (bonus — not counted in Zeny/Hr)",
                            accentColor: "#ff4b4b",
                            addLabel: "Add Extra Item",
                          })}
                          {renderHistoryItemTable({
                            h,
                            listKey: "costs",
                            title: "Costs",
                            accentColor: "#dc3545",
                            addLabel: "Add Cost",
                          })}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => deleteHistoryEntry(h.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
                              style={{ background: "#fef2f2", color: "#dc3545", border: "1px solid #dc3545" }}
                            >
                              <Trash2 size={12} />
                              Delete Session
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
          {historyOpen && filteredHistory.length > 0 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap" style={{ borderTop: "1px solid #eef0f3" }}>
              <span style={{ fontSize: "0.76rem", color: "#374151" }}>
                Showing {historyPageSize === "all" ? filteredHistory.length : (safeHistoryPage - 1) * Number(historyPageSize) + 1}–{historyPageSize === "all" ? filteredHistory.length : Math.min(filteredHistory.length, safeHistoryPage * Number(historyPageSize))} of {filteredHistory.length}
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs" style={{ color: "#374151" }}>
                  Show
                  <select
                    value={historyPageSize}
                    onChange={(e) => { setHistoryPageSize(e.target.value); setHistoryPage(1); }}
                    className="px-2 py-1 rounded-md outline-none"
                    style={{ background: "#ffffff", border: "1px solid #d1d5db", color: "#242631" }}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="all">All</option>
                  </select>
                  per page
                </label>
                {historyPageSize !== "all" && (
                  <>
                    <button
                      onClick={() => setHistoryPage(Math.max(1, safeHistoryPage - 1))}
                      disabled={safeHistoryPage <= 1}
                      className="px-2.5 py-1 rounded-md text-xs"
                      style={{ background: "#ffffff", border: "1px solid #d1d5db", color: safeHistoryPage <= 1 ? "#4b5563" : "#374151" }}
                    >Previous</button>
                    <span style={{ fontSize: "0.76rem", color: "#374151" }}>Page {safeHistoryPage} of {historyPageCount}</span>
                    <button
                      onClick={() => setHistoryPage(Math.min(historyPageCount, safeHistoryPage + 1))}
                      disabled={safeHistoryPage >= historyPageCount}
                      className="px-2.5 py-1 rounded-md text-xs"
                      style={{ background: "#ffffff", border: "1px solid #d1d5db", color: safeHistoryPage >= historyPageCount ? "#4b5563" : "#374151" }}
                    >Next</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Analytics */}
        <div className="rounded-lg p-4 mt-6 mb-10" style={{ background: "#f3f4f6", border: "1px solid #d1d5db" }}>
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Coins size={13} color="#ff4b4b" />
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.14em", color: "#374151", textTransform: "uppercase" }}>
                Analytics — Daily {chartMetric === "zeny" ? "Zeny" : chartMetric === "time" ? "Time Farmed" : "Zeny/Hr Trend"}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center rounded-md overflow-hidden" style={{ border: "1px solid #d1d5db" }}>
                {[
                  { key: "zeny", label: "Zeny" },
                  { key: "time", label: "Time" },
                  { key: "rate", label: "Zeny/Hr" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setChartMetric(opt.key)}
                    className="px-3 py-1 text-xs font-medium"
                    style={{
                      background: chartMetric === opt.key ? "#ff4b4b" : "#eef0f3",
                      color: chartMetric === opt.key ? "#f3f4f6" : "#4b5563",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {chartMetric !== "rate" && (
                <label className="flex items-center gap-1.5 text-xs" style={{ color: "#374151", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={chartSplitByMap}
                    onChange={(e) => setChartSplitByMap(e.target.checked)}
                    style={{ width: "13px", height: "13px", accentColor: "#ff4b4b", cursor: "pointer" }}
                  />
                  Split by map
                </label>
              )}
            </div>
          </div>

          {dailyChartData.length === 0 ? (
            <div className="py-8 text-center" style={{ color: "#4b5563", fontSize: "0.85rem" }}>
              No completed sessions yet — end a session to start tracking daily zeny.
            </div>
          ) : chartMetric === "rate" ? (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={dailyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#4b5563", fontSize: 11 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#4b5563", fontSize: 11 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                    width={40}
                  />
                  <Tooltip cursor={{ stroke: "#d1d5db" }} content={<DailyChartTooltip splitByMap={false} />} />
                  <Line
                    type="monotone"
                    dataKey="zenyPerHr"
                    stroke="#ff4b4b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#ff4b4b" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={dailyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#4b5563", fontSize: 11 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#4b5563", fontSize: 11 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={false}
                    tickFormatter={(v) =>
                      chartMetric === "zeny" ? (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v) : `${v.toFixed(0)}h`
                    }
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,75,75,0.08)" }}
                    content={<DailyChartTooltip splitByMap={chartSplitByMap} />}
                  />
                  {chartSplitByMap
                    ? chartMapNames.map((name) => (
                        <Bar
                          key={name}
                          dataKey={chartMetric === "zeny" ? `z__${name}` : `t__${name}`}
                          name={name}
                          stackId="day"
                          fill={mapColorFor(name)}
                          radius={[0, 0, 0, 0]}
                        />
                      ))
                    : (
                        <Bar
                          dataKey={chartMetric === "zeny" ? "totalZeny" : "totalDurationHrs"}
                          fill="#ff4b4b"
                          radius={[4, 4, 0, 0]}
                        />
                      )}
                </BarChart>
              </ResponsiveContainer>
              {chartSplitByMap && (
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
                  {chartMapNames.map((name) => (
                    <div key={name} className="flex items-center gap-1.5">
                      <span style={{ width: "9px", height: "9px", borderRadius: "2px", background: mapColorFor(name), display: "inline-block" }} />
                      <span style={{ fontSize: "0.7rem", color: "#374151" }}>{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {undoDeleted && (
        <div
          className="fixed left-1/2 flex items-center gap-3 px-4 py-2.5 rounded-lg"
          style={{
            bottom: "20px",
            transform: "translateX(-50%)",
            background: "#f3f4f6",
            border: "1px solid #ff4b4b",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            zIndex: 50,
          }}
        >
          <span style={{ fontSize: "0.82rem", color: "#242631" }}>Session deleted</span>
          <button
            onClick={undoDeleteHistoryEntry}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium"
            style={{ background: "#ff4b4b", color: "#242631" }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
