/* BENCH2DEX homepage dataset.
 * Counts, means, and efficiencies follow the paper, with the supplied ACT
 * evaluation update. Channel LSCR comes from the supplied evaluation exports.
 * Task and embodiment details follow the paper supplement.
 */

const ROLLOUTS_PER_CELL = 50;
const TASK_EMB_SETTINGS = 26;
// Published baselines: kept fixed for the paper tables and historical charts.
const POLICIES = ["ACT", "DPC", "PI05", "GR00T"];
const POLICY_LABEL = { ACT: "ACT", "DPC": "DP", PI05: "π₀.₅", GR00T: "GR00T N1.5" };
const CHANNELS = ["none", "equi", "inv", "full"];
const CHANNEL_LABEL = { none: "None", equi: "Equi.", inv: "Inv.", full: "Full" };
const CHANNEL_COLOR = { none: "#9AA3A0", equi: "#C77E1A", inv: "#1E94A6", full: "#6B4FB0" };

/* Embodiments: render / contact / tactile asset stems + paper description. */
const EMBODIMENTS = [
  { id: "kuka_sharpa",      name: "IIWA7 + Sharpa",       arm: "IIWA7",        hand: "Sharpa",        tasks: ["32","26","73"],     render: "kuka_sharpa",      contact: "kuka_sharpa",      tactile: "iiwa7_sharpa_26_000032",      desc: "A white KUKA-style arm with bright orange accent panels, paired with a smooth anthropomorphic hand. The clean enclosed hand silhouette contrasts with the strong white-orange arm styling.", morphology: "5-finger anthropomorphic" },
  { id: "jaka_dexhand021",  name: "JAKA ZU7 + DexHand021",arm: "JAKA ZU7",     hand: "DexHand021",    tasks: ["80"],               render: "jaka_zu7_dexhand021", contact: "jaka_zu7_dexhand021", tactile: "jaka_zu7_dexhand021_flange_80_000007", desc: "A metallic-gray collaborative arm with blue circular joint caps, paired with a silver dexterous hand with dense exposed mechanisms, a ribbed palm surface, and slender articulated fingers.", morphology: "5-finger actuated" },
  { id: "panda_orca",       name: "Panda + Orca",         arm: "Panda",        hand: "Orca",          tasks: ["61","22"],          render: "panda_orca",       contact: "panda_orca",       tactile: "panda_orca_22_000007",       desc: "A light Panda-style arm attached to a dark hand with a narrow palm and strongly spread fingers. Long separated digits with bright caps create an open fan-like silhouette.", morphology: "5-finger spread" },
  { id: "panda_allegro",    name: "Panda + Allegro",       arm: "Panda",        hand: "Allegro",       tasks: ["64"],               render: "panda_allegro",    contact: "panda_allegro",    tactile: "panda_allegro_64_000002",    desc: "A light Panda-style arm paired with a compact dark modular hand. The boxy palm, rectangular segmented fingers, and bright fingertip caps create a sharp contrast with the soft industrial arm.", morphology: "4-finger modular" },
  { id: "rm65_revo2",       name: "RM65 + Revo2",         arm: "RM65",         hand: "Revo2",         tasks: ["67","24"],          render: "rm_65_BrainCo",    contact: "rm_65_BrainCo",    tactile: "rm_65_revo2_24_000003",      desc: "A smooth white arm paired with a compact anthropomorphic hand with a rounded palm shell, slim fingers, and a clean enclosed structure. The embodiment appears polished and tightly integrated.", morphology: "5-finger anthropomorphic" },
  { id: "xarm_ability",     name: "xArm7 + Ability",       arm: "xArm7",        hand: "Ability",      tasks: ["79","03"],          render: "xarm_ability",     contact: "xarm_ability",     tactile: "xarm7_ability_03_000001",    desc: "A white arm with smooth enclosed links, paired with a compact white hand with a rounded palm shell, dark finger coverings, and a thick side thumb. The embodiment is soft-contoured and highly enclosed.", morphology: "5-finger enclosed" },
  { id: "xarm_leap",        name: "xArm7 + LEAP",          arm: "xArm7",        hand: "LEAP",         tasks: ["09","62","51"],     render: "xarm_leap",        contact: "xarm_leap",        tactile: "xarm7_leap_51_000007",        desc: "A white arm with smooth rounded links, attached to a compact low-profile robotic hand with a blocky palm and modular fingers. Stacked box-like segments and bright caps give it a clean geometric appearance.", morphology: "4-finger modular" },
  { id: "ur5_rh5dg2",       name: "UR5 + RH5DG2",          arm: "UR5",          hand: "RH5DG2",       tasks: ["60","07","34"],     render: "ur5_RH5DG2",       contact: "ur5_RH5DG2",       tactile: "ur5_rh5dg2_flange_07_000003",desc: "A metallic-gray UR5-style arm with blue circular joint caps, attached to a white-and-gray hand with a rounded palm shell, dark cylindrical finger coverings, and a thick side thumb close to the palm plane.", morphology: "5-finger rounded" },
  { id: "ur5_rh56dfx",      name: "UR5 + RH56DFX",         arm: "UR5", hand: "RH56DFX", tasks: ["06","12","42"],  render: "ur5_RH56DFX",      contact: "ur5_RH56DFX",      tactile: "ur5_rh56dfx_flange_06_000003",desc: "A metallic-gray industrial arm with rounded cylindrical links and blue joint caps, ending in a white-and-silver dexterous hand with a sculpted palm shell, dark finger pads, and a large side thumb.", morphology: "5-finger sculpted" },
  { id: "ur5_shadow",       name: "UR5 + Shadow",          arm: "UR5",          hand: "Shadow",       tasks: ["43","76"],          render: "ur5_shadow_hand",  contact: "ur5_shadow_hand",  tactile: "ur5_shadow_hand_flange_43_000002", desc: "A metallic-gray arm with blue circular joints, attached to a dark anthropomorphic hand with slim multi-joint fingers and bright fingertip caps. The hand is lightweight and human-like relative to the heavier arm.", morphology: "5-finger human-like" },
  { id: "ur5_schunk",       name: "UR5 + Schunk",          arm: "UR5",          hand: "Schunk",       tasks: ["08","44"],          render: "ur5_schunk_hand",  contact: "ur5_schunk_hand",  tactile: "ur5_schunk_hand_flange_08_000006", desc: "A metallic-gray arm with blue round joint covers, paired with a robust white industrial hand. A broad palm, thick segmented fingers, gray fingertip pads, and heavy thumb create a sturdy precision-oriented look.", morphology: "5-finger industrial" },
  { id: "ur5_wuji",         name: "UR5 + Wuji",            arm: "UR5",          hand: "Wuji",         tasks: ["27","21"],          render: "ur5_wuji",         contact: "ur5_wuji",         tactile: "ur5_wuji_flange_21_000001",  desc: "A metallic-gray arm with blue circular joint caps, ending in a slim dexterous hand with long narrow fingers and a thin side thumb. The hand appears lighter and more elongated than other UR5-based embodiments.", morphology: "5-finger elongated" }
];

/* Task catalog: description, success condition, stage sequence, capability tags, default embodiment. */
const TASKS = [
  { id:"03", name:"Wine Glass Plate Balance", emb:"xarm_ability", stages:["Place First Glass","Place Second Glass","Place Third Glass"], tags:["bimanual","carry","placement"], desc:"Carry three filled wine glasses to the plates of three diners without spilling or knocking over any objects.", success:"All three wine glasses are kept upright (within 30° of vertical), each placed within 0.10 m of a target position, and fully at rest." },
  { id:"06", name:"Fruit Bowl Loading", emb:"ur5_rh56dfx", stages:["Move Bowl","Place Apple 1","Place Apple 2","Place Banana"], tags:["bimanual","loading","placement"], desc:"Move the bowl to the center of the table and place two apples and a banana into it.", success:"The bowl is moved into the central zone and kept upright; two apples and one banana are placed inside it, all at rest." },
  { id:"07", name:"Citrus Plate Loading", emb:"ur5_rh5dg2", stages:["Place Lemon 1","Place Lemon 2","Place Orange 1","Place Orange 2"], tags:["bimanual","loading"], desc:"Place two lemons and two oranges onto the plate.", success:"Two lemons and two oranges are on the plate, each center within 0.15 m of the plate interior." },
  { id:"08", name:"Frypan Stand & Pour", emb:"ur5_schunk", stages:["Pour Soy Sauce","Pour Olive Oil"], tags:["tool-use","pouring","articulated"], desc:"Place the frypan onto the display stand, then pour the soy sauce and olive oil into the frypan one by one.", success:"The frypan is on the stand; soy sauce and olive oil are each tilted ≥50° over the frypan to pour, then returned upright and at rest while the bread stays in the pan." },
  { id:"09", name:"Cleaner Box Loading", emb:"xarm_leap", stages:["Place Cleaner","Place Soap"], tags:["bimanual","loading","stabilize"], desc:"Use both hands to lift the cleaner upright into the wooden box, then place the soap into the box.", success:"The wooden box is upright, the cleaner is inside and upright (not tilted), and the soap is inside the box." },
  { id:"12", name:"Screwdriver Box & Hammer", emb:"ur5_rh56dfx", stages:["Place Flat Right","Place Phillips Left","Strike Wood Block","Place Hammer"], tags:["tool-use","striking","sequential"], desc:"Place the right screwdriver into the box and move the box left, place the left screwdriver, then strike the block once with the hammer and place the hammer into the box.", success:"Both screwdrivers are inside the upright box; the hammer strikes the wooden block once, then is placed inside the box." },
  { id:"21", name:"Condiment Box Loading", emb:"ur5_wuji", stages:["Place Soy Sauce","Place Vinegar","Place MSG"], tags:["loading","upright-constraint"], desc:"Place the monosodium glutamate, soy sauce, and vinegar into the wooden box.", success:"The box is upright; MSG, soy sauce, and vinegar are all inside it, with soy and vinegar kept upright, all at rest." },
  { id:"22", name:"Tool Box Loading", emb:"panda_orca", stages:["Place Phillips","Place Flat","Place Wrench","Place Drill"], tags:["bimanual","tool-use","loading"], desc:"Right hand places the drill and flat screwdriver and left hand places the wrench and Phillips screwdriver into the wooden box.", success:"All four tools are placed inside the upright wooden box." },
  { id:"24", name:"Stationery Category Sorting", emb:"rm65_revo2", stages:["Put Pen in Cup","Put Marker in Cup","Put Glue in Box","Put Battery in Box"], tags:["bimanual","sorting","upright-constraint"], desc:"Right hand sorts marker and battery into the pen cup and plastic box; left hand sorts the pen and glue into the respective containers.", success:"Pen and marker are upright in the pen cup; glue and battery are in the plastic box; both containers upright, all at rest." },
  { id:"26", name:"Canned Food Tray Arrangement", emb:"kuka_sharpa", stages:["Place Master Chef Can","Place MSG","Place Milk Box","Place Potted Meat Can"], tags:["bimanual","loading","tray"], desc:"Left hand places the master chef can and MSG and right hand places the milk box and potted meat can onto the tray.", success:"All four items are placed on the tray and kept upright, with the tray upright and all at rest." },
  { id:"27", name:"Ball Box Loading", emb:"ur5_wuji", stages:["Place Soccer Ball","Place Tennis Ball","Place Golf Ball","Place Pingpong Ball"], tags:["loading","spherical"], desc:"Place the mini soccer ball, tennis ball, golf ball, and ping-pong ball into the box.", success:"The box is upright and all four balls are inside it, each within 0.22 m of the box interior." },
  { id:"32", name:"Baking Tray Prep", emb:"kuka_sharpa", stages:["Place Pudding","Place Gelatin","Place Spatula","Place Brush"], tags:["bimanual","loading","tray"], desc:"Left hand places the brush and spatula and right hand places the small pudding box and large gelatin box onto the tray.", success:"All four items are on the tray, with the tray kept upright and all at rest." },
  { id:"34", name:"Fridge Wine Interhand Pour", emb:"ur5_rh5dg2", stages:["Open Fridge","Take Bottle","Pour Wine","Return Bottle","Close Fridge"], tags:["articulated","handover","pouring","long-horizon"], desc:"Open the fridge, take out the wine bottle, hand it to the right hand in the air to pour a glass, return it to the left hand to put back, and close the door.", success:"The fridge door is opened, the bottle is lifted out, tilted ≥50° toward the glass to pour, returned upright inside the fridge, and the door is closed." },
  { id:"42", name:"Trash Disposal", emb:"ur5_rh56dfx", stages:["Place Paper","Place Bottle","Place Banana Peel"], tags:["articulated","disposal","bimanual"], desc:"Open the trash can lid, throw the crumpled paper in, use the left hand to throw the bottle and banana peel in, then close the lid.", success:"The trash can is upright and the paper, bottle, and banana peel are all inside it, at rest." },
  { id:"43", name:"Fridge Fruit Shelf Sorting", emb:"ur5_shadow", stages:["Open Fridge","Place Lemon","Place Banana","Close Fridge"], tags:["articulated","sorting","long-horizon"], desc:"Move the banana to the left side, open both fridge doors, place the lemon on the upper shelf and the banana on the lower shelf, then close the door.", success:"Banana and lemon are inside the fridge, both doors are closed, and both objects are at rest." },
  { id:"44", name:"Microwave Bowl Loading", emb:"ur5_schunk", stages:["Open Microwave Door","Put Baguette in Bowl","Put Bowl in Microwave","Close Microwave Door"], tags:["articulated","nested","long-horizon"], desc:"Open the microwave door, bring the bowl to the microwave, place the baguette into the bowl, place the bowl into the microwave, and close the door.", success:"The bowl is inside the microwave cavity and upright, the baguette is in the bowl, and the door is closed." },
  { id:"51", name:"Toilet Lid Cleaner Pour", emb:"xarm_leap", stages:["Open Toilet Lid","Pour Cleaner","Close Toilet Lid"], tags:["articulated","pouring"], desc:"Open the toilet lid, pour the cleaner into the toilet, and close the toilet lid.", success:"The lid is opened, the cleaner is lifted and tilted ≥50° toward the bowl to pour while the lid stays open, then the lid is closed." },
  { id:"60", name:"Breadbasket Fast-Food Loading", emb:"ur5_rh5dg2", stages:["Place Baguette","Place Bread","Place Hamburg","Place French Fries"], tags:["loading","bimanual"], desc:"Place the baguette and bread into the bread basket, move the basket to the center, then place the hamburger and french fries into the basket.", success:"The basket is upright and the fries, hamburger, bread, and baguette are all inside it." },
  { id:"61", name:"Medicine Shoebox Pack", emb:"panda_orca", stages:["Place Pillbottle","Place Tooth Paste","Place Hydrating Oil"], tags:["loading","upright-constraint"], desc:"Move the shoe box to the center of the table, then place the pill bottle, toothpaste, and hydrating oil into the box.", success:"The shoe box is upright and the pill bottle, toothpaste, and hydrating oil are all inside it." },
  { id:"62", name:"Shoebox Accessory Pack", emb:"xarm_leap", stages:["Place Seal","Place Shoe","Place Pet Collar"], tags:["loading","bimanual"], desc:"Place the seal into the shoe box and move the box to center, then place the shoe and pet collar into the box.", success:"The shoe box is upright and the seal, shoe, and pet collar are inside it, at rest." },
  { id:"64", name:"Sports Ball Cup Sort", emb:"panda_allegro", stages:["Place Tennis Ball","Place Baseball","Place Racquetball","Place Golf Ball"], tags:["sorting","spherical"], desc:"Place the tennis ball and baseball into the large cup and the racquetball and golf ball into the small cup.", success:"Both cups are upright; tennis+baseball in the large cup and racquet+golf in the small cup, all at rest." },
  { id:"67", name:"Faucet Cup Water Fill", emb:"rm65_revo2", stages:["Put Spoon in Mug","Put Mug Under Faucet","Open and Close Faucet","Put Mug on Tray"], tags:["articulated","pouring","long-horizon"], desc:"Place the spoon into the mug, place the mug under the faucet, open the faucet to fill the mug then close it, and place the mug onto the tray.", success:"Spoon in the upright mug; while the mug is under the faucet, the faucet is opened then closed; the mug is placed at rest on the tray." },
  { id:"73", name:"Jigsaw Puzzle Assembly", emb:"kuka_sharpa", stages:["Assemble Green Piece","Assemble Red Piece","Assemble Blue Piece","Assemble Yellow Piece"], tags:["precise-assembly","long-horizon"], desc:"Use the right and left hands in turn to assemble the green, red, blue, and yellow pieces around the fixed white center piece, forming a rectangle.", success:"All four colored pieces are at their target positions around the white piece (within 0.02 m in xy and 0.01 m in height), all at rest." },
  { id:"76", name:"Soup Serving", emb:"ur5_shadow", stages:["Scoop First Portion","Scoop Second Portion","Place Bowl","Return Ladle"], tags:["bimanual","scooping","tool-use"], desc:"Hold the bowl beside the pot with the left hand, ladle two scoops of soup into the bowl with the right hand, carry the bowl to the front-right zone, and return the ladle.", success:"The pot is on the stove, the bowl is held near the pot, the ladle dips into the pot and is brought over the bowl twice, the bowl is delivered to the serving zone, and the ladle is returned." },
  { id:"79", name:"Bimanual Piano Melody", emb:"xarm_ability", stages:["Play Left Melody","Play Right Melody"], tags:["temporal-sequence","fine-bimanual","contact-rich"], desc:"Both hands play the piano key sequence C-C-G-G-A-A-G together, the left hand playing bass and the right hand treble.", success:"The left hand plays the bass melody and the right hand plays the treble melody C-C-G-G-A-A-G, each note key pressed in sequence." },
  { id:"80", name:"Gaming Desk Setup", emb:"jaka_dexhand021", stages:["Straighten Monitor","Press Escape Key","Click Left Mouse Button"], tags:["heterogeneous","tool-use","interface"], desc:"Straighten the monitor screen forward with both hands, press the ESC key, move the mouse back to the left of the keyboard, and click the left mouse button.", success:"The monitor is straightened, the ESC key is pressed once, the mouse is returned to the left of the keyboard, and the left mouse button is clicked." }
];

/* Main-table values from the paper, tab:policy_generalization_results.
 * Each channel count is stable successes out of 50 rollouts. */
const RESULTS = {
  "12": {"ACT":[16,5,18,10],"DPC":[8,1,3,6],"PI05":[18,18,14,16],"GR00T":[16,10,19,10]},
  "21": {"ACT":[12,3,3,3],"DPC":[3,0,0,0],"PI05":[15,7,4,4],"GR00T":[4,4,0,1]},
  "22": {"ACT":[17,10,8,5],"DPC":[16,10,8,10],"PI05":[41,34,35,34],"GR00T":[32,20,31,33]},
  "24": {"ACT":[3,0,1,0],"DPC":[0,0,0,0],"PI05":[0,0,0,0],"GR00T":[0,0,0,0]},
  "26": {"ACT":[17,2,0,0],"DPC":[0,0,0,0],"PI05":[15,4,2,3],"GR00T":[10,3,0,2]},
  "27": {"ACT":[10,5,1,2],"DPC":[0,0,0,0],"PI05":[7,5,9,8],"GR00T":[21,4,6,7]},
  "32": {"ACT":[9,2,1,0],"DPC":[3,0,0,0],"PI05":[25,8,14,10],"GR00T":[19,7,3,1]},
  "34": {"ACT":[8,6,14,6],"DPC":[0,0,0,0],"PI05":[6,2,4,5],"GR00T":[3,2,1,5]},
  "42": {"ACT":[15,6,9,7],"DPC":[4,3,2,1],"PI05":[19,18,23,24],"GR00T":[15,6,13,7]},
  "43": {"ACT":[1,0,0,0],"DPC":[1,0,0,0],"PI05":[7,3,0,2],"GR00T":[2,1,1,0]},
  "44": {"ACT":[38,29,29,29],"DPC":[16,7,7,3],"PI05":[45,32,32,31],"GR00T":[44,27,39,32]},
  "51": {"ACT":[16,19,20,13],"DPC":[6,1,2,4],"PI05":[21,22,25,23],"GR00T":[32,20,24,25]},
  "60": {"ACT":[11,6,3,1],"DPC":[0,0,1,0],"PI05":[13,3,6,3],"GR00T":[5,2,0,0]},
  "61": {"ACT":[5,1,5,4],"DPC":[0,0,0,1],"PI05":[15,2,14,12],"GR00T":[26,3,11,5]},
  "62": {"ACT":[19,18,11,12],"DPC":[6,1,1,3],"PI05":[29,21,28,24],"GR00T":[22,14,15,16]},
  "64": {"ACT":[4,0,0,0],"DPC":[0,1,0,0],"PI05":[21,9,2,11],"GR00T":[13,1,0,2]},
  "67": {"ACT":[6,5,2,2],"DPC":[0,0,0,0],"PI05":[7,6,9,9],"GR00T":[10,6,11,6]},
  "73": {"ACT":[0,0,0,0],"DPC":[0,0,0,0],"PI05":[0,0,0,0],"GR00T":[10,0,0,0]},
  "76": {"ACT":[2,0,0,0],"DPC":[0,0,0,0],"PI05":[0,0,0,0],"GR00T":[1,0,0,0]},
  "79": {"ACT":[1,0,0,0],"DPC":[2,0,1,0],"PI05":[6,5,2,2],"GR00T":[21,6,5,8]},
  "80": {"ACT":[25,10,17,10],"DPC":[5,3,2,2],"PI05":[16,11,23,20],"GR00T":[32,8,29,18]},
  "03": {"ACT":[15,11,13,13],"DPC":[2,1,2,1],"PI05":[16,14,21,19],"GR00T":[20,9,18,18]},
  "06": {"ACT":[34,15,13,12],"DPC":[24,3,6,9],"PI05":[36,10,12,19],"GR00T":[37,8,12,6]},
  "07": {"ACT":[43,20,14,26],"DPC":[17,3,4,3],"PI05":[35,12,34,32],"GR00T":[45,17,23,16]},
  "08": {"ACT":[20,8,3,7],"DPC":[0,1,0,0],"PI05":[8,9,7,6],"GR00T":[32,14,33,26]},
  "09": {"ACT":[34,20,7,5],"DPC":[3,4,2,1],"PI05":[36,21,29,24],"GR00T":[22,20,22,27]}
};

/* Paper-reported four-channel mean LSCR (%) for each task and policy. */
const LSCR = {
  "12": {"ACT":56.3,"DPC":33.9,"PI05":57.5,"GR00T":57.8},
  "21": {"ACT":31.8,"DPC":3.7,"PI05":33.2,"GR00T":27.7},
  "22": {"ACT":37.5,"DPC":42.4,"PI05":86,"GR00T":70.8},
  "24": {"ACT":23.1,"DPC":0.1,"PI05":2.3,"GR00T":1.4},
  "26": {"ACT":34.6,"DPC":13.3,"PI05":38.8,"GR00T":33.8},
  "27": {"ACT":13.1,"DPC":0.4,"PI05":19.3,"GR00T":27.9},
  "32": {"ACT":11.6,"DPC":7,"PI05":37.8,"GR00T":36.9},
  "34": {"ACT":26.4,"DPC":27.5,"PI05":36.1,"GR00T":47.5},
  "42": {"ACT":64.5,"DPC":28.3,"PI05":66.5,"GR00T":54.8},
  "43": {"ACT":2.6,"DPC":7.4,"PI05":29.6,"GR00T":17.5},
  "44": {"ACT":37.4,"DPC":43.1,"PI05":78.4,"GR00T":80.5},
  "51": {"ACT":35.3,"DPC":23,"PI05":53.3,"GR00T":68},
  "60": {"ACT":15.8,"DPC":2.1,"PI05":15.6,"GR00T":6.4},
  "61": {"ACT":21.5,"DPC":10,"PI05":39.8,"GR00T":35.3},
  "62": {"ACT":56.3,"DPC":25.8,"PI05":68.3,"GR00T":54.3},
  "64": {"ACT":2.5,"DPC":3,"PI05":33.6,"GR00T":19.5},
  "67": {"ACT":35.4,"DPC":3.8,"PI05":40.5,"GR00T":41.9},
  "73": {"ACT":12.5,"DPC":6.3,"PI05":8.4,"GR00T":30.3},
  "76": {"ACT":11.5,"DPC":0.8,"PI05":14,"GR00T":13.9},
  "79": {"ACT":1.0,"DPC":2.3,"PI05":16,"GR00T":31.3},
  "80": {"ACT":46,"DPC":22.2,"PI05":50.3,"GR00T":59.3},
  "03": {"ACT":72,"DPC":35.7,"PI05":76.2,"GR00T":73.2},
  "06": {"ACT":62,"DPC":49.1,"PI05":71.6,"GR00T":66.6},
  "07": {"ACT":69.9,"DPC":37.8,"PI05":67.3,"GR00T":68.8},
  "08": {"ACT":51.3,"DPC":14.3,"PI05":33.3,"GR00T":68.8},
  "09": {"ACT":76.3,"DPC":34,"PI05":88.5,"GR00T":80.8}
};

/* Expert-normalized efficiency: null means no successful rollout. */
const EFFICIENCY = {
  "12": {"ACT":1.033,"DPC":0.826,"PI05":0.935,"GR00T":0.904},
  "21": {"ACT":0.929,"DPC":0.853,"PI05":0.917,"GR00T":0.886},
  "22": {"ACT":0.983,"DPC":0.902,"PI05":0.97,"GR00T":0.955},
  "24": {"ACT":0.916,"DPC":null,"PI05":null,"GR00T":null},
  "26": {"ACT":0.966,"DPC":null,"PI05":0.927,"GR00T":0.92},
  "27": {"ACT":0.988,"DPC":null,"PI05":1.006,"GR00T":0.952},
  "32": {"ACT":0.924,"DPC":0.898,"PI05":1.022,"GR00T":0.986},
  "34": {"ACT":1.053,"DPC":null,"PI05":1.095,"GR00T":0.97},
  "42": {"ACT":0.946,"DPC":0.84,"PI05":0.924,"GR00T":0.89},
  "43": {"ACT":1.069,"DPC":0.673,"PI05":0.898,"GR00T":0.843},
  "44": {"ACT":1.016,"DPC":0.947,"PI05":1.026,"GR00T":1.001},
  "51": {"ACT":0.99,"DPC":0.974,"PI05":1.058,"GR00T":0.967},
  "60": {"ACT":0.951,"DPC":0.916,"PI05":0.959,"GR00T":0.944},
  "61": {"ACT":1.004,"DPC":0.83,"PI05":0.994,"GR00T":0.968},
  "62": {"ACT":1.025,"DPC":0.889,"PI05":1.005,"GR00T":0.979},
  "64": {"ACT":0.728,"DPC":0.74,"PI05":0.769,"GR00T":0.741},
  "67": {"ACT":0.899,"DPC":null,"PI05":0.891,"GR00T":0.938},
  "73": {"ACT":null,"DPC":null,"PI05":null,"GR00T":0.957},
  "76": {"ACT":0.883,"DPC":null,"PI05":null,"GR00T":0.793},
  "79": {"ACT":0.799,"DPC":0.771,"PI05":0.882,"GR00T":0.882},
  "80": {"ACT":1.013,"DPC":0.866,"PI05":1.016,"GR00T":1.004},
  "03": {"ACT":1.089,"DPC":0.995,"PI05":1.059,"GR00T":0.984},
  "06": {"ACT":0.96,"DPC":0.916,"PI05":0.941,"GR00T":0.928},
  "07": {"ACT":0.838,"DPC":0.82,"PI05":0.84,"GR00T":0.834},
  "08": {"ACT":1.214,"DPC":1.001,"PI05":1.063,"GR00T":1.217},
  "09": {"ACT":0.951,"DPC":0.774,"PI05":0.885,"GR00T":0.808}
};

/* Verified channel LSCR from the supplied ACT, DP, pi0.5, and GR00T exports.
 * All four baselines cover all 26 tasks.
 * Null never means zero.
 * Channel order: None, Equi., Inv., Full. */
const LSCR_CHANNELS = {
  "12": {"ACT":[0.69,0.455,0.58,0.525],"DPC":[0.47,0.225,0.325,0.335],"PI05":[0.625,0.525,0.55,0.6],"GR00T":[0.67,0.475,0.67,0.495]},
  "21": {"ACT":[0.4867,0.2267,0.24,0.32],"DPC":[0.12,0.013300000000000001,0,0.013300000000000001],"PI05":[0.593333333333,0.306666666667,0.166666666667,0.26],"GR00T":[0.5533,0.26,0.1267,0.16670000000000001]},
  "22": {"ACT":[0.575,0.35,0.3,0.275],"DPC":[0.55,0.415,0.325,0.405],"PI05":[0.905,0.81,0.885,0.84],"GR00T":[0.775,0.555,0.72,0.78]},
  "24": {"ACT":[0.325,0.175,0.2,0.225],"DPC":[0,0.005,0,0],"PI05":[0.02,0.015,0.02,0.035],"GR00T":[0.03,0.02,0,0.005]},
  "26": {"ACT":[0.685,0.3,0.195,0.205],"DPC":[0.175,0.105,0.14,0.11],"PI05":[0.54,0.265,0.395,0.35],"GR00T":[0.535,0.285,0.275,0.255]},
  "27": {"ACT":[0.26,0.125,0.075,0.065],"DPC":[0,0,0,0.015],"PI05":[0.16,0.125,0.29,0.195],"GR00T":[0.53,0.14,0.225,0.22]},
  "32": {"ACT":[0.24,0.055,0.105,0.065],"DPC":[0.12,0.045,0.055,0.06],"PI05":[0.51,0.24,0.465,0.295],"GR00T":[0.58,0.225,0.335,0.335]},
  "34": {"ACT":[0,0.472,0.584,0],"DPC":[0.264,0.3,0.292,0.244],"PI05":[0.456,0.34,0.316,0.332],"GR00T":[0.49200000000000005,0.4,0.512,0.496]},
  "42": {"ACT":[0.66,0.6,0.6733,0.6467],"DPC":[0.3333,0.34,0.2,0.26],"PI05":[0.64,0.5866666666670001,0.68,0.753333333333],"GR00T":[0.6133,0.43329999999999996,0.58,0.5667]},
  "43": {"ACT":[0,0,0.105,0],"DPC":[0.105,0.055,0.07,0.065],"PI05":[0.36,0.29,0.24,0.295],"GR00T":[0.27,0.175,0.12,0.135]},
  "44": {"ACT":[0,0.72,0.75,0.025],"DPC":[0.59,0.415,0.375,0.345],"PI05":[0.935,0.725,0.75,0.725],"GR00T":[0.935,0.675,0.85,0.76]},
  "51": {"ACT":[0,0.5267,0.6267,0.26],"DPC":[0.34,0.18,0.17329999999999998,0.2267],"PI05":[0.526666666667,0.54,0.54,0.526666666667],"GR00T":[0.7667,0.5867,0.6667000000000001,0.7]},
  "60": {"ACT":[0.26,0.185,0.13,0.055],"DPC":[0.025,0.01,0.02,0.03],"PI05":[0.305,0.08,0.14,0.1],"GR00T":[0.17,0.05,0.02,0.015]},
  "61": {"ACT":[0.32,0.1267,0.2667,0.1467],"DPC":[0.1333,0.0867,0.1067,0.0733],"PI05":[0.56,0.16,0.48666666666700004,0.386666666667],"GR00T":[0.6667000000000001,0.24,0.3267,0.18]},
  "62": {"ACT":[0.66,0.66,0.4867,0.4467],"DPC":[0.31329999999999997,0.24670000000000003,0.2133,0.26],"PI05":[0.733333333333,0.653333333333,0.68,0.6666666666669999],"GR00T":[0.6733,0.5067,0.48,0.5133]},
  "64": {"ACT":[0.1,0,0,0],"DPC":[0.02,0.04,0.045,0.015],"PI05":[0.515,0.345,0.165,0.32],"GR00T":[0.415,0.1,0.15,0.115]},
  "67": {"ACT":[0.305,0.41,0.35,0.35],"DPC":[0.025,0.05,0.02,0.055],"PI05":[0.38,0.275,0.49,0.475],"GR00T":[0.46,0.365,0.46,0.39]},
  "73": {"ACT":[0.25,0.065,0.14,0.045],"DPC":[0.145,0.035,0.045,0.025],"PI05":[0.135,0.06,0.1,0.04],"GR00T":[0.715,0.135,0.215,0.145]},
  "76": {"ACT":[0.32,0.07,0.04,0.03],"DPC":[0.015,0.01,0,0.005],"PI05":[0.15,0.09,0.215,0.105],"GR00T":[0.31,0.105,0.095,0.045]},
  "79": {"ACT":[0.02,0,0.01,0.01],"DPC":[0.04,0,0.03,0.02],"PI05":[0.25,0.15,0.1,0.14],"GR00T":[0.52,0.17,0.22,0.34]},
  "80": {"ACT":[0.2467,0.4533,0.6467,0.4933],"DPC":[0.28,0.22,0.16670000000000001,0.22],"PI05":[0.44666666666700006,0.326666666667,0.64,0.6],"GR00T":[0.7467,0.3467,0.7132999999999999,0.5667]},
  "03": {"ACT":[0.7067,0.6267,0.78,0.7667],"DPC":[0.4067,0.38,0.3467,0.2933],"PI05":[0.753333333333,0.68,0.793333333333,0.82],"GR00T":[0.7867000000000001,0.6,0.7867000000000001,0.7533]},
  "06": {"ACT":[0.825,0.58,0.55,0.525],"DPC":[0.7,0.43,0.44,0.395],"PI05":[0.915,0.58,0.67,0.7],"GR00T":[0.92,0.525,0.66,0.56]},
  "07": {"ACT":[0.945,0.635,0.535,0.68],"DPC":[0.575,0.29,0.345,0.3],"PI05":[0.76,0.375,0.79,0.765],"GR00T":[0.975,0.595,0.64,0.54]},
  "08": {"ACT":[0.62,0.49,0.44,0.5],"DPC":[0.2,0.17,0.09,0.11],"PI05":[0.34,0.38,0.33,0.28],"GR00T":[0.78,0.42,0.78,0.77]},
  "09": {"ACT":[0.91,0.85,0.62,0.67],"DPC":[0.32,0.34,0.37,0.33],"PI05":[0.92,0.79,0.96,0.87],"GR00T":[0.76,0.83,0.81,0.83]}
};

/* Task-macro summaries: paper values plus the supplied ACT evaluation update. */
const LSCR_MEAN = {"ACT": 34.9, "DPC": 18.3, "PI05": 44.7, "GR00T": 45.2};
const EFFICIENCY_MEAN = {"ACT": 0.967, "DPC": 0.865, "PI05": 0.96, "GR00T": 0.93};
const PAPER_SR_SUMMARY = {
  "ACT": [29.3,15.5,14.8,12.8,18.1],
  "DPC": [8.9,3,3.2,3.4,4.6],
  "PI05": [35.2,21.2,26.8,26.2,27.4],
  "GR00T": [38,16.3,24.3,20.8,24.9]
};


const LSCR_CHANNEL_MEAN = {"ACT": [40.03884615384615, 35.21961538461539, 36.26576923076923, 28.192692307692308], "DPC": [24.09846153846154, 16.948846153846155, 16.129615384615384, 16.194615384615386], "PI05": [51.6705128205, 37.358974359, 45.6064102564, 44.1358974359], "GR00T": [60.18730769230769, 35.45538461538462, 43.988846153846154, 41.06807692307692]};

// Paper tactile comparison: mean SR only; never infer channel counts.
const TACTILE_COMPARISON = {
  "policyId": "GR00T_TACTILE",
  "baselineId": "GR00T",
  "without": 24.9,
  "withTactile": 25.5,
  "delta": 0.6,
  tasks: [
    {"taskId":"03","without":32.5,"withTactile":31.5,"delta":-1.0},
    {"taskId":"06","without":31.5,"withTactile":33.0,"delta":1.5},
    {"taskId":"07","without":50.5,"withTactile":50.0,"delta":-0.5},
    {"taskId":"08","without":52.5,"withTactile":46.0,"delta":-6.5},
    {"taskId":"09","without":45.5,"withTactile":54.0,"delta":8.5},
    {"taskId":"12","without":27.5,"withTactile":31.5,"delta":4.0},
    {"taskId":"21","without":4.5,"withTactile":8.5,"delta":4.0},
    {"taskId":"22","without":58.0,"withTactile":68.0,"delta":10.0},
    {"taskId":"24","without":0.0,"withTactile":0.0,"delta":0.0},
    {"taskId":"26","without":7.5,"withTactile":9.5,"delta":2.0},
    {"taskId":"27","without":19.0,"withTactile":21.0,"delta":2.0},
    {"taskId":"32","without":15.0,"withTactile":17.5,"delta":2.5},
    {"taskId":"34","without":5.5,"withTactile":3.0,"delta":-2.5},
    {"taskId":"42","without":20.5,"withTactile":23.0,"delta":2.5},
    {"taskId":"43","without":2.0,"withTactile":2.0,"delta":0.0},
    {"taskId":"44","without":71.0,"withTactile":68.0,"delta":-3.0},
    {"taskId":"51","without":50.5,"withTactile":37.5,"delta":-13.0},
    {"taskId":"60","without":3.5,"withTactile":5.0,"delta":1.5},
    {"taskId":"61","without":22.5,"withTactile":24.0,"delta":1.5},
    {"taskId":"62","without":33.5,"withTactile":32.5,"delta":-1.0},
    {"taskId":"64","without":8.0,"withTactile":7.0,"delta":-1.0},
    {"taskId":"67","without":16.5,"withTactile":21.5,"delta":5.0},
    {"taskId":"73","without":5.0,"withTactile":2.0,"delta":-3.0},
    {"taskId":"76","without":0.5,"withTactile":1.5,"delta":1.0},
    {"taskId":"79","without":20.0,"withTactile":16.5,"delta":-3.5},
    {"taskId":"80","without":43.5,"withTactile":48.0,"delta":4.5}
  ]
};

/* Aggregate the raw matrix; nothing here is hand-typed from prose. */
function aggregate(policy, channel) {
  let sum = 0, n = 0;
  const ci = CHANNELS.indexOf(channel);
  for (const t of TASKS) {
    const r = RESULTS[t.id][policy];
    if (r && ci >= 0) { sum += r[ci]; n++; }
  }
  const total = n * ROLLOUTS_PER_CELL;      // 26 * 50 = 1300
  return { sum, total, sr: total ? sum / total : 0, mean: n ? sum / n : 0 };
}

const PROOF_STATS = [
  { n: "26",   label: "Long-Horizon Tasks",       sub: "task–embodiment settings",  tip: "26 task–embodiment settings spanning the 12 evaluated embodiments." },
  { n: "12",   label: "Bimanual Embodiments",      sub: "arm–hand morphologies",     tip: "12 arm–hand embodiments evaluated, spanning 5-finger and 4-finger morphologies." },
  { n: "1.3K", label: "Teleoperated Trajectories", sub: "human demonstrations",      tip: "≈1,300 human teleoperated demonstrations recorded through the Manus + ARKit pipeline." },
  { n: "8",    label: "Synchronized Modalities",   sub: "per frame, aligned",        tip: "RGB, depth, joint state, object state, shared visuo-tactile representation, 2D boxes, 3D boxes, occupancy grids." },
  { n: "7",    label: "Controlled Variation Factors", sub: "5 invariance + 2 equivariance", tip: "5 invariance factors (scene background, tabletop texture, lighting conditions, distractor objects, camera pose) + 2 equivariance factors (object pose, table height)." },
  { n: "20.8K",label:"Published Baseline Rollouts",  sub: "26 × 4 × 4 × 50",           tip: "26 task–embodiment settings × 4 published baseline policies × 4 channels × 50 rollouts = 20,800 rollouts." }
];

const MODALITIES = [
  { key:"rgb",       name:"RGB",            desc:"Multi-view RGB image streams." },
  { key:"depth",     name:"Depth",          desc:"Per-frame metric depth maps." },
  { key:"joint",     name:"Joint States",   desc:"Arm + hand proprioceptive qpos/qvel." },
  { key:"object",    name:"Object States",   desc:"Per-object 6-DoF pose and velocity." },
  { key:"tactile",   name:"Visuo-Tactile Representation", desc:"Unified surface-aligned tactile images defined on hand contact surfaces." },
  { key:"box2d",     name:"2D Boxes",       desc:"Projected object bounding boxes." },
  { key:"box3d",     name:"3D Boxes",       desc:"3D bounding boxes (center, size, orientation)." },
  { key:"occ",       name:"Occupancy Grid", desc:"Occupancy grid state and associated metadata." }
];

const GENERALIZATION_AXES = [
  { name:"Scene Background", group:"invariance", note:"Background context used for visual rendering only." },
  { name:"Tabletop Texture", group:"invariance", note:"Visual material of the support surface." },
  { name:"Lighting Conditions", group:"invariance", note:"Lighting embedded in the sampled scene." },
  { name:"Distractor Objects", group:"invariance", note:"Distractor objects on the tabletop." },
  { name:"Camera Pose",   group:"invariance", note:"World-mounted and wrist-mounted camera perturbations." },
  { name:"Object Pose",   group:"equivariance", note:"Task-relevant initial object poses within valid bounds." },
  { name:"Table Height",  group:"equivariance", note:"Vertical support-surface offset." }
];

const RESOURCE_CARDS = [
  { title:"Policy Usage",     body:"For environment setup, training, and evaluation guidance for all four supported policies, see the Policy Usage chapter in the Bench2Dex Documentation.", href:"https://bench2dex.github.io/doc/#policy", meta:"Documentation", kind:"docs" },
  { title:"Task Description", body:"For a complete list of all 26 tasks with detailed descriptions grouped by robot embodiment, see the Tasks chapter in the Bench2Dex Documentation.", href:"https://bench2dex.github.io/doc/#tasks", meta:"Documentation", kind:"docs" }
];

// Register additional evaluations here. Percent metrics use 0–100; efficiency
// is a ratio. Keep reported macro summaries separate from rounded task values.
const EVALUATION_PROTOCOLS = [{
  id: "standard", label: "Standard Evaluation", taskIds: EMBODIMENTS.flatMap(e=>e.tasks),
  taskSetVersion: "paper-task-set", episodesPerChannel: 50,
  terminationVersion: "paper-stable-success", expertReferenceVersion: "paper-expert-reference",
  description: "26 task–embodiment settings · 50 episodes per channel · Four evaluation channels"
}];
const EVALUATION_POLICIES = POLICIES.map((id,displayOrder)=>({
  id, label: POLICY_LABEL[id]+(id==="GR00T" ? " · w/o Tactile" : ""),
  variantLabel: id==="GR00T" ? "w/o Tactile" : "", family: id,
  inputs: ["PI05","GR00T"].includes(id) ? "Vision + Proprioception + Language" : "Vision + Proprioception",
  protocolId: "standard", displayOrder,
  modelVersion: POLICY_LABEL[id], resultVersion: "Paper Baselines",
  trainingSetting: ["ACT","DPC"].includes(id) ? "Trained from scratch" : "Fine-tuned from a pretrained checkpoint",
  sourceLabel: "Bench2Dex Paper", sourceUrl: "https://arxiv.org/abs/2609.15726"
})).concat({
  id: "GR00T_TACTILE", label: "GR00T N1.5 · w/ Tactile", variantLabel: "w/ Tactile",
  family: "GR00T", inputs: "Vision + Proprioception + Language + Tactile",
  protocolId: "standard", displayOrder: 4, comparisonPolicyId: "GR00T",
  modelVersion: "GR00T N1.5", resultVersion: "Paper Tactile Comparison",
  trainingSetting: "Fine-tuned from a pretrained checkpoint",
  sourceLabel: "Bench2Dex Paper", sourceUrl: "https://arxiv.org/abs/2609.15726"
});
const EVALUATION_CHANNELS = POLICIES.flatMap(policyId=>TASKS.flatMap(task=>
  CHANNELS.map((channelId,ci)=>({
    policyId, taskId: task.id, channelId, status: "reported",
    successes: RESULTS[task.id][policyId][ci], episodes: ROLLOUTS_PER_CELL,
    lscr: LSCR_CHANNELS[task.id][policyId][ci]===null ? null : LSCR_CHANNELS[task.id][policyId][ci]*100
  }))
)).concat(TASKS.flatMap(task=>CHANNELS.map(channelId=>({
  policyId: "GR00T_TACTILE", taskId: task.id, channelId, status: "reported",
  episodes: ROLLOUTS_PER_CELL, successes: null, lscr: null
}))));
const EVALUATION_TASKS = POLICIES.flatMap(policyId=>TASKS.map(task=>({
  policyId, taskId: task.id, status: "reported",
  sr: RESULTS[task.id][policyId].reduce((sum,v)=>sum+v,0)*100/(CHANNELS.length*ROLLOUTS_PER_CELL),
  lscr: LSCR[task.id][policyId], lscrScope: "four-channel-mean", lscrEpisodes: 200, efficiency: EFFICIENCY[task.id][policyId],
  efficiencyStatus: EFFICIENCY[task.id][policyId]===null ? "no-success" : "reported"
}))).concat(TACTILE_COMPARISON.tasks.map(task=>({
  policyId: "GR00T_TACTILE", taskId: task.taskId, status: "reported",
  sr: task.withTactile, srScope: "four-channel-mean", srEpisodes: 200,
  lscr: null, efficiency: null
})));
const EVALUATION_SUMMARIES = POLICIES.map(policyId=>({
  policyId, taskCount: TASKS.length, scope: "task-macro", status: "reported",
  sr: PAPER_SR_SUMMARY[policyId][4], lscr: LSCR_MEAN[policyId], efficiency: EFFICIENCY_MEAN[policyId],
  efficiencyTaskCount: TASKS.filter(t=>EFFICIENCY[t.id][policyId]!==null).length,
  channelSr: PAPER_SR_SUMMARY[policyId].slice(0,4),
  channelLscr: LSCR_CHANNEL_MEAN[policyId]
})).concat({
  policyId: "GR00T_TACTILE", taskCount: TASKS.length, scope: "task-macro", status: "reported",
  sr: TACTILE_COMPARISON.withTactile, lscr: null, efficiency: null,
  channelSr: CHANNELS.map(()=>null), channelLscr: CHANNELS.map(()=>null)
});

window.BENCH = {
  EVALUATION_PROTOCOLS, EVALUATION_POLICIES, EVALUATION_CHANNELS, EVALUATION_TASKS, EVALUATION_SUMMARIES,
  ROLLOUTS_PER_CELL, TASK_EMB_SETTINGS, POLICIES, POLICY_LABEL,
  CHANNELS, CHANNEL_LABEL, CHANNEL_COLOR, EMBODIMENTS, TASKS, RESULTS, LSCR, LSCR_CHANNELS, LSCR_CHANNEL_MEAN, LSCR_MEAN, EFFICIENCY, EFFICIENCY_MEAN, PAPER_SR_SUMMARY, aggregate,
  PROOF_STATS, MODALITIES, GENERALIZATION_AXES, RESOURCE_CARDS, TACTILE_COMPARISON
};
