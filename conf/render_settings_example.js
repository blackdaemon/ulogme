// various settings for the rendering, to be modified by user

// these are all regex patterns and the corresponding mapped title string
// the function mapwin() below will use these to transform the raw window
// titles into common groups. For example, any title mentioning Google Chrome
// may get mapped to just "Google Chrome".
// these get applied in order they are specified, from top to bottom
var title_mappings = [
{pattern: /Google Chrome$|Mozilla Firefox$/, mapto : 'Web browser (other)'},
{pattern: /(chrome|firefox).*\|.*YouTube/, mapto : 'YouTube'},
{pattern: /mplayer.*\||^totem /, mapto : 'Mplayer'},
{pattern: /Prima PLAY/, mapto : 'Video'},
{pattern: /(chrome|firefox).*\|.* - Gmail - /, mapto : 'Gmail'},
{pattern: /\bjava\b.*\beclipse\b.*\|/, mapto : 'Eclipse IDE'},
{pattern: /java.*eclipse.*\|.*ulogme/, mapto : 'Eclipse IDE (ulogme)'},
{pattern: /(chrome|firefox).*\|.*(The Learning Exchange|Stack Overflow|DSXchange).* - (Google Chrome|Mozilla Firefox)$/, mapto : 'Web browser (work)'},
{pattern: /^\/opt\/ibm\/notes/, mapto : 'Mail'},
{pattern: /^gvim/, mapto : 'GVIM'},
{pattern: /^gedit/, mapto : 'gedit'},
{pattern: /^gnome-terminal|putty|x3270/, mapto : 'Terminal'},
{pattern: /IBM Data Studio$|SQuirreL SQL Client/, mapto : 'SQL'},
{pattern: /^\/opt\/IBM\/IDA/, mapto : 'IDA'},
{pattern: /Microsoft OneNote Online$/, mapto : 'OneNote notes'},
{pattern: /^nautilus.* - File Browser$|MidnightCommander.*\|mc/, mapto : 'File browser'},
{pattern: /[sS]ametime.*\|/, mapto : 'Sametime chats'},
{pattern: /[sS]ametime.*\|.* group chat \[started: /, mapto : 'Sametime group chats'},
{pattern: /(chrome|firefox)\|.*? Slack$/, mapto : 'Slack'},
{pattern: /\bsoffice.bin.*\|/, mapto : 'LibreOffice'},
{pattern: /(chrome|firefox).*\|.*Meetings: [0-9]{4}-[0-9]{4}|^Sharing Tools$|sametime.*\|.*Instant Meeting Room/, mapto : 'Meetings'},
{pattern: /\|ulogme( - (Google Chrome|Mozilla Firefox.*))?$|^gnome-terminal.*ulogme|Developer Tools.*localhost:8124/, mapto : 'ulogme'},
{pattern: /chrome\|.*?(Change and Configuration Management|MURAL|todoist$/, mapto : 'Planning'},
{pattern : /__IDLE/, mapto : 'Computer idle'}, // __IDLE is a special token
{pattern : /__LOCKEDSCREEN/, mapto : 'Computer locked'}, // __LOCKEDSCREEN is a special token
{pattern : /__SUSPEND/, mapto : 'Computer suspended'}, // __SUSPEND is a special token
];

// be very careful with ordering in the above because titles
// get matched from up to down (see mapwin()), so put the more specific
// window title rules on the bottom and more generic ones on top

/*
This function takes a raw window title w as string
and outputs a more compact code, to be treated as a single
unit during rendering. Every single possibility output from
this function will have its own row and its own analysis
*/
function mapwin(w) {
  var n = title_mappings.length;
  var mapped_title = 'MISC';
  for(var i=0;i<n;i++) {
    var patmap = title_mappings[i];
    if(patmap.pattern.test(w)) {
      mapped_title = patmap.mapto;
    }
  }
  return mapped_title;
}

// Productivity levels and their weights (in percentage)
const PL_VERY_PRODUCTIVE = 100;	// If you worked for 4 hours of 8 on this, your score would be 50%
const PL_PRODUCTIVE = 75;
const PL_NEUTRAL = 50;	// If you worked for 4 hours of 8 on this, your score would be 25%
const PL_DISTRACTED = 25;
const PL_INACTIVE = 0;

const PL_NAMES = {};
PL_NAMES[PL_VERY_PRODUCTIVE] =  "Very productive";
PL_NAMES[PL_PRODUCTIVE] = "Productive";
PL_NAMES[PL_NEUTRAL] = "Distracted";
PL_NAMES[PL_DISTRACTED] = "Very distracted";
PL_NAMES[PL_INACTIVE] = "Inactive";

// These groups will be rendered together in the "barcode view". For example, I like
// to group my work stuff and play stuff together.
var display_groups = [];
display_groups.push(["GVIM", "gedit", "Terminal", "Mail", "IDA", "Sametime chats", "Sametime group chats", "Slack", "SQL", "Web browser (work)", "File browser", "LibreOffice", "Planning"]); // work related
display_groups.push(["OneNote notes", "Planning", "ulogme"]); // administrative tasks
display_groups.push(["Web browser (other)", "Gmail", "YouTube", "Mplayer", "Video", "Eclipse IDE (ulogme)", "MISC"]); // others
display_groups.push(["Computer locked", "Computer idle", "Computer suspended"]); // computer not being used 

// Activity groups to group related work. This will be shown as inner piechart ring.
// All related activities will be in outer piechart ring.
var activity_groups = [];
activity_groups.push({
	name: "Work",
       abbrev: "WRK",
	color: 'hsl(356, 66%, 48%)',
	plevel: PL_VERY_PRODUCTIVE,
	titles:[
	        "Terminal", "Mail", "IDA", 
	        "Sametime chats", "Sametime group chats", "Slack", "SQL",
	        "DataStage", "Web browser (work)", "File browser", 
	        "LibreOffice", "OneNote notes", 
	        "Meetings", "Planning"
	]
});
activity_groups.push({
	name: "Learning",
    abbrev: "LRN",
	color: 'hsl(14, 81%, 59%)',
	plevel: PL_PRODUCTIVE,
	titles:[
	        "Learning",
	]
});
activity_groups.push({
	name: "Other",
    abbrev: "OTH",
	color: 'hsl(185, 100%, 35%)',
	plevel: PL_NEUTRAL,
	titles:[
	        "Web browser (other)",  
	        "Eclipse IDE", 
	        "ulogme",
	        "GVIM", "gedit", 
	]
});
activity_groups.push({
	name: "Distracted",
    abbrev: "DIS",
	color: 'hsl(46, 81%, 62%)',
	plevel: PL_DISTRACTED,
	titles:[
	        "Gmail", "YouTube", "Mplayer", 
	        "Video", "anubis (rdesktop)", 
	        "Eclipse IDE (ulogme)", "Eclipse IDE (enso)", 
	        "MISC"
	]
});
activity_groups.push({
	name: "Idle",
    abbrev: "IDL",
	color: 'hsl(18, 27%, 24%)',
	plevel: PL_INACTIVE,
	titles:[
	        "Computer locked", "Computer idle", "Computer suspended"
	]
});

var activity_groups_lookup = {};
for (var i = 0; i < activity_groups.length; i++) {
  ag = activity_groups[i];
  activity_groups_lookup[ag.name] = ag
}

// list of titles that classify as "hacking", or being productive in general
// the main goal of the day is to get a lot of focused sessions of hacking
// done throughout the day. Windows that arent in this list do not
// classify as hacking, and they break "streaks" (events of focused hacking)
// the implementation is currently quite hacky, experimental and contains
// many magic numbers.
var draw_hacking = true;
var hacking_titles = ["IDA", "RTC", "Terminal", "DataStage", "SQL", "GVIM", "gedit", "LibreOffice"];
var hacking_title = "Being in the zone";

// draw notes row?
var draw_notes = true;

// experimental coffee levels indicator :)
// looks for notes that mention coffee and shows 
// levels of coffee in body over time
var draw_coffee = true;

// Reload interval in minutes. Set to 0 to turn off.
var auto_reload_interval = 5;

var show_productivity_pulse = true;
var show_productivity_gain = true;
var skip_zero_weekend_pulse = true;
const PRODUCTIVITY_PULSE_NAME = "Productivity score";

// Represent time of day as object
// Example:
//   t = time("15:30"); t.getHours(); t.getMinutes(); t.getSeconds(); t.toString(); 
function time(time_str) {
	var _time = new Date(
		"1970-01-01 {hr:min}:00".replace('{hr:min}', time_str)
	);

	return {
		getHours: function() {
			return _time.getHours();
		},
		getMinutes: function() {
			return _time.getMinutes();
		},
		getSeconds: function() {
			return _time.getSeconds();
		},
		getTime: function() {
			return _time.getTime();
		},
		toString: function() {
			return _time.toLocalTimeString(); // or use `toTimeString()`
		}
	};
}

var working_hours = [];
working_hours.push({ name: "Sunday", start: null, end: null });
working_hours.push({ name: "Monday", start: time("09:00"), end: time("17:00") });
working_hours.push({ name: "Tuesday", start: time("09:00"), end: time("17:00") });
working_hours.push({ name: "Wednesday", start: time("09:00"), end: time("17:00") });
working_hours.push({ name: "Thursday", start: time("09:00"), end: time("17:00") });
working_hours.push({ name: "Friday", start: time("09:00"), end: time("17:00") });
working_hours.push({ name: "Saturday", start: null, end: null });
