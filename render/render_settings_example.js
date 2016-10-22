// various settings for the rendering, to be modified by user

// these are all regex patterns and the corresponding mapped title string
// the function mapwin() below will use these to transform the raw window
// titles into common groups. For example, any title mentioning Google Chrome
// may get mapped to just "Google Chrome".
// these get applied in order they are specified, from top to bottom
var title_mappings = [
{pattern : /Google Chrome/, mapto : 'Google Chrome'},
{pattern : /Firefox/, mapto : 'Google Chrome'}, // lol
{pattern : /MATLAB/, mapto : 'Matlab'},
{pattern : /Figure/, mapto : 'Matlab'},
{pattern : /Inotebook/, mapto : 'INotebook'},
{pattern : /.pdf/, mapto : 'Papers'},
{pattern : /Gmail/, mapto : 'Gmail'},
{pattern : /karpathy@/, mapto : 'Terminal'},
{pattern : /Sublime Text/, mapto : 'SubText2'},
{pattern : /\.js.*Sublime Text/, mapto : 'SubText2 Coding'},
{pattern : /\.py.*Sublime Text/, mapto : 'SubText2 Coding'},
{pattern : /\.html.*Sublime Text/, mapto : 'SubText2 Coding'},
{pattern : /\.cpp.*Sublime Text/, mapto : 'SubText2 Coding'},
{pattern : /\.h.*Sublime Text/, mapto : 'SubText2 Coding'},
{pattern : /TeXworks/, mapto : 'Latex'},
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

// These groups will be rendered together in the "barcode view". For example, I like
// to group my work stuff and play stuff together.
var display_groups = [];
display_groups.push(["Gmail", "Google Chrome", "MISC", "SubText2"]); // internet related
display_groups.push(["Matlab", "SubText2 Coding", "INotebook", "Terminal", "Papers"]); // work related
display_groups.push(["TeXworks"]); // paper writing related
display_groups.push(["Computer locked", "Computer idle", "Computer suspended"]); // computer not being used 

// list of titles that classify as "hacking", or being productive in general
// the main goal of the day is to get a lot of focused sessions of hacking
// done throughout the day. Windows that arent in this list do not
// classify as hacking, and they break "streaks" (events of focused hacking)
// the implementation is currently quite hacky, experimental and contains 
// many magic numbers.
var draw_hacking = true; // by default turning this off
var hacking_titles = ["INotebook", "Terminal", "Matlab", "SubText2 Coding"];
var hacking_title = "Continuous Hacking";

// draw notes row?
var draw_notes = true;

// experimental coffee levels indicator :)
// looks for notes that mention coffee and shows 
// levels of coffee in body over time
var draw_coffee = false;

// Reload interval in minutes. Set to 0 to turn off.
var auto_reload_interval = 5;

var show_productivity_pulse = true;
var show_productivity_gain = true;
var skip_zero_weekend_pulse = true;
const PRODUCTIVITY_PULSE_NAME = "Productivity score";

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
display_groups.push(["GVIM", "gedit", "Terminal", "Mail", "RTC", "IDA", "Sametime chats", "Sametime group chats", "SQL", "DataStage", "Web browser (work)", "File browser", "LibreOffice"]); // work related
display_groups.push(["OneNote notes", "Todoist", "Claiming", "Expense Reimbursement", "ulogme"]); // administrative tasks
display_groups.push(["Web browser (other)", "Gmail", "YouTube", "Mplayer", "Video", "anubis (rdesktop)", "Eclipse IDE (ulogme)", "Eclipse IDE (enso)", "MISC"]); // others
display_groups.push(["Computer locked", "Computer idle", "Computer suspended"]); // computer not being used 

// Activity groups to group related work. This will be shown as inner piechart ring.
// All related activities will be in outer piechart ring.
var activity_groups = [];
activity_groups.push({
	name: "Work",
	color: 'hsl(356, 66%, 48%)',
	plevel: PL_VERY_PRODUCTIVE,
	titles:[
	        "Terminal", "Mail", "RTC", "IDA", 
	        "Sametime chats", "Sametime group chats", "SQL", 
	        "DataStage", "Web browser (work)", "File browser", 
	        "LibreOffice", "OneNote notes", "Todoist", "Claiming", 
	        "Expense Reimbursement",
	        "Meetings",
	]
});
activity_groups.push({
	name: "Learning",
	color: 'hsl(14, 81%, 59%)',
	plevel: PL_PRODUCTIVE,
	titles:[
	        "Learning",
	]
});
activity_groups.push({
	name: "Other",
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
	color: 'hsl(18, 27%, 24%)',
	plevel: PL_INACTIVE,
	titles:[
	        "Computer locked", "Computer idle", "Computer suspended"
	]
});

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
