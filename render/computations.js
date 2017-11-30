function compute_productivity_pulse() {
	var dtall = 0;
	var counts = {};
	_.each(es, function(e) {
		if (e.t < t00 || e.t > ft) {
			return;
		}
		counts[e.m] = (counts[e.m] || 0) + e.dt;
		dtall += e.dt;
	});
	
	var productivity_pulse = 0;
	for (var agi = 0; agi < activity_groups.length; agi += 1) {
		if (!(activity_groups[agi].name in data_tree)) {
		    continue;
		}
        ag = data_tree[activity_groups[agi].name];
		productivity_pulse = productivity_pulse + (ag.plevel / dtall * ag.total);  
		var activity_names = Object.keys(ag.activities).sort(function(a,b){
			var cmp = a.toLowerCase().localeCompare(b.toLowerCase())
			return cmp != 0 ? cmp : a.localeCompare(b);
		});
        var an;
		for (i = 0; i < activity_names.length; i += 1) {
			an = activity_names[i];
			activitiesData.push({
				name: an,
				y: ag.activities[an],
				color: activity_color_hash[an],
			});
		}
	}
    var dow = new Date(t00_initial * 1000).getDay();
    var today_workable_hours = working_hours[dow].start && working_hours[dow].end ? 
        (working_hours[dow].end.getTime() - working_hours[dow].start.getTime())/1000/60/60 
        : 0;
    if (today_workable_hours > 0) {
    	if (dtall/60/60 < today_workable_hours*2) {
            productivity_pulse = productivity_pulse / (today_workable_hours / (dtall/60/60));
    	}
    }
	productivity_pulse = Math.round(productivity_pulse);
	return productivity_pulse;
}