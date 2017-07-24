var timetable = function(id,settings) {
	this.id = id;
	this.oDates;
	this.userSettings = settings;
	this.defaultSettings = {
		barColor: "#337ab7",
		step: "days",
		stepCount: 12,
		maxDaysDayStep: 12,
		maxDaysWeekStep: 84,
		maxDaysMonthStep: 548,
		updateHead: false
	}
	this.items = [];
	
	this.create = function() {
		$("#"+this.id).html(this.makeTable());	
	}
	
	this.makeTable = function() {
		var ret = "";
		
		if(this.setOverallDates()) {
			if(this.getSetting("updateHead") !== false) {
				this.updateHead(this.getSetting("updateHead"));	
			}
			var self = this;
			$.each(this.items, function(i,v) {
				ret += '<tr>';
				ret += '<td>'+v.name+'</td>';
				ret += '<td>'+v.start.toLocaleString()+'</td>';
				ret += '<td>'+v.end.toLocaleString()+'</td>';
				ret += '<td>'+self.makeBar(v)+'</td>';
				ret += '</tr>';	
			});
		} else {
			ret = '<tr><td>No data found.</td></tr>';
		}
		
		return ret;
	}
	
	this.makeBar = function(item) {
	
		var timespan = item.end - item.start;
		var width = (timespan / this.getSetting("stepDivider")*this.getSetting("stepWidth"))+"%";
		var offset = (((item.start - this.getSetting("start")) / this.getSetting("stepDivider"))*this.getSetting("stepWidth"))+"%";

		var ret = '<div class="tt-bar pull-left" style="width:'+width+';background-color:'
					+(("barColor" in item) ? item.barColor : this.getSetting("barColor"))+'"></div>';
		if(offset !== "0%") {
			ret = '<div class="tt-offset pull-left" style="width:'+offset+'"></div>'+ret;	
		}
		
		return ret;
	}
	
	this.updateHead = function(id) {
		var ret = 'Neue Überschrift';
		
		$("#"+id).html(ret);
	}
	
	this.setOverallDates = function() {
		if(this.items.length > 0) {
			var earliestDate;
			var latestDate;
			var difference;
			
			$.each(this.items, function(i, v) {
				if(typeof earliestDate == "undefined") {
					earliestDate = v.start;
					latestDate = v.end;
				} else {
					earliestDate = ((typeof earliestDate == "undefined") || v.start < earliestDate) ? v.start : earliestDate;
					latestDate = ((typeof latestDate == "undefined") || v.end > earliestDate) ? v.end : latestDate;
				}
			});
			difference = latestDate - earliestDate;
			
			this.defaultSettings.step = this.getStepType(difference);
			this.defaultSettings.stepCount = this.getStepCount(difference);
			this.defaultSettings.stepDivider = this.getStepDivider(difference);
			this.defaultSettings.stepWidth = this.getStepWidth(difference);
			this.defaultSettings.start = earliestDate;
			this.defaultSettings.end = latestDate;
			this.defaultSettings.diff = difference;

			return true;
		} else return false;
	}
	
	this.getStepType = function(timespan) {
		var days = timespan / (1000*60*60*24);
		
		if(days <= this.getSetting("maxDaysDayStep")) {
			return "days";
		} else if(days <= this.getSetting("maxDaysWeekStep")) {
			return "weeks";
		} else if(days <= this.getSetting("maxDaysMonthStep")) {
			return "months";
		} else return "years";
	}
	
	this.getStepCount = function(timespan) {
		switch(this.getSetting("step")) {
    		case "days":
        		return (Math.floor(timespan / (1000*60*60*24))) > 0 ? (Math.floor(timespan / (1000*60*60*24))) : 1;
			case "weeks":
				return Math.floor(timespan / (1000*60*60*24*7));
			case "months":
				return Math.floor(timespan / (1000*60*60*24*30));
			default:
				return Math.floor(timespan / (1000*60*60*24*365));
		}
	}
	
		
	this.getStepDivider = function(timespan) {
		switch(this.getSetting("stepType")) {
			case "days":
				return 1000*60*60;	
			default:
				return 1000*60*60*24;
		}
	}
	
	this.getStepWidth = function(timespan) {
		return 100/(timespan/this.getSetting("stepDivider"));
	}

	
	this.addItem = function(item) {
		this.items.push(item);
	}
	
	this.getSetting = function(name) {
		if(name in this.userSettings) {
			return this.userSettings[name];
		} else if (name in this.defaultSettings) {
			 return this.defaultSettings[name];
		} else return false;
	}
}