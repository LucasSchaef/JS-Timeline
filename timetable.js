/**
 * @file timetable.js
 * @author Lucas Schäf
 * @version 0.1
 *
 * Note: This uses jQuery, jQuery UI and bootstrap.
 */
 
 
 /**
   * timetable class
   *
   * @param {String} id - The ID of the element, that the timeline will be inserted into.
   * @param {Object} settings - Object containing settings for the timelibe.
   */
var timetable = function(id,settings) {
	this.id = id; // Save ID into global variable.
	this.userSettings = (typeof settings == "undefined") ? {} : settings; // If defined, save user settings into global variable.
	/* Default settings */
	this.defaultSettings = {
		barColor: "#337ab7", // Default background color for bars
		step: "days", // Default step
		stepCount: 12, // Default step count
		maxDaysDayStep: 12, // Maximum amount of days, to which the step "days" will be used
		maxDaysWeekStep: 84, // Maximum amount of days, to which the step "weeks" will be used
		maxDaysMonthStep: 548, // Maximum amout of days to which the step "months" will be used
		nameHead: "What?", // Default headline for first column
		startHead: "Start", // Default headline for second column
		endHead: "End", // Default headline for third column
		scheduleHead: "Schedule", // Default headline for last column. If set to "true", a date overview will be created
		useDateTooltip: true // If true, the columns for "start" and "end" will not be created. A tooltip will be used instead.
	}
	this.items = []; // Empty array for items
	
	
	/**
	 * create function
	 *
	 * This has to be called to eventually load the timeline into defined element.
	 */
	this.create = function() {
		$("#"+this.id).html(this.makeTable()); // Load timeline into element with defined ID
		
		if(this.getSetting("useDateTooltip")) { // If tooltips are used for start and end date, this activates them
			$(document).on("mouseenter", "#"+this.id, function(e) {
				$(".tt-tooltip").tooltip({
					content: function() {
						return $(this).prop("title");	
					}
				});
			});	
		}
	}
	
	/**
	 * makeTable function
	 *
	 * This creates the timeline.
	 *
	 * @return {String} Returns the HTML of the timeline.
	 */
	this.makeTable = function() {
		// Create table head
		var ret = '<table class="table table-hover table-bordered">';
        ret += '<thead>';
		ret += this.createTableHead();
        ret += '</thead><tbody>';
		
		
		if(this.setOverallDates()) { // Calculate overall dates for calculations
			var self = this;
			$.each(this.items, function(i,v) { // Create row for each item
				ret += '<tr>';
				if(!self.getSetting("useDatesTooltip")) { // If no tooltips will be used, create columns
					ret += '<td><strong>'+v.name+'</strong></td>';
					ret += '<td>'+v.start.toLocaleString()+'</td>';
					ret += '<td>'+v.end.toLocaleString()+'</td>';
				} else { // Create tooltips
					ret += '<td><a class="tt-tooltip" href="#" title="<strong>'
									+self.getSetting("startHead")+
									':</strong> '+v.start.toLocaleString()+'<br /><strong>'
									+self.getSetting("endHead")+
									':</strong> '+v.end.toLocaleString()+'">'
									+v.name+
									'</a></td>';
				}
				// Create timeline bars
				ret += '<td>'+self.makeBar(v)+'</td>';
				ret += '</tr>';	
			});
		} else { // If overall dates could not be calculated, return this.
			ret += '<tr><td>No data found.</td></tr>';
		}
		ret += '</table>';
		return ret;
	}
	
	/**
	 * makeBar function
	 *
	 * This creates the timeline bars for a single item
	 *
	 * @param {Object} item - A single timeline item object
	 * @return [String} Returns the HTML of a single bar
	 **/
	this.makeBar = function(item) {
	
		var timespan = item.end - item.start; // Timespan for this item
		
		var width = (timespan / this.getSetting("stepDivider")*this.getSetting("stepWidth"))+"%"; // Calculate width of bar div
		var offset = (((item.start - this.getSetting("start")) / this.getSetting("stepDivider"))*this.getSetting("stepWidth"))+"%"; // Calculate width of offset div

		/* Create HTML */
		var ret = '<div class="tt-bar pull-left" style="width:'+width+';background-color:'
					+(("barColor" in item) ? item.barColor : this.getSetting("barColor"))+'"></div>';
					
		/* Add offset, if necessary */
		if(offset !== "0%") {
			ret = '<div class="tt-offset pull-left" style="width:'+offset+'"></div>'+ret;	
		}
		
		return ret;
	}
	
	/**
	 * createTableHead function
	 *
	 * Creates the header of the timeline table.
	 *
	 * @return {string} The HTML of the table header.
	 **/
	
	this.createTableHead = function() {
		ret = '<tr><th width="15%">'+this.getSetting("nameHead")+'</th>';
		
		var width = "55%"; // Width for last column, depends on usage of tooltips
		
		if(!this.getSetting("useDatesTooltip")) { // Create headers for columns, if tooltips are disabled
			ret += '<th width="15%">'
						+this.getSetting("startHead")+
						'</th><th width="15%">'
						+this.getSetting("endHead")+
						'</th>';
			width = "85%"; // Set new width for last column
		}
		
		/* Last column, if "scheduleHead" setting is set to true, a date overview will be created */
		ret += '<th width="'+width+'">'+((this.getSetting("scheduleHead") !== true) ? this.getSetting("scheduleHead") : this.calcScheduleHead())+'</th></tr>';	
		return ret;
	}
	
	/**
	 * setOverallDates function
	 *
	 * This sets the overall dates, needed for calculating.
	 *
	 * @return {boolean} True, if there are items and therefore overall dates can be calculated. False, if there are no items.
	 **/
	this.setOverallDates = function() {
		if(this.items.length > 0) { // Check if there are items
			var earliestDate;
			var latestDate;
			var difference;
			
			$.each(this.items, function(i, v) { // Calculate overall start and end
				if(typeof earliestDate == "undefined") {
					earliestDate = v.start;
					latestDate = v.end;
				} else {
					earliestDate = ((typeof earliestDate == "undefined") || v.start < earliestDate) ? v.start : earliestDate;
					latestDate = ((typeof latestDate == "undefined") || v.end > earliestDate) ? v.end : latestDate;
				}
			});
			difference = latestDate - earliestDate;
			
			// Set overall dates
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
	
	/**
	 * getStepType function 
	 *
	 * Calculates the type of steps that will be used in the timeline.
	 *
	 * @param {number} timespan - A timespan between two dates (in miliseconds)
	 * @return {string} The type of step to be used
	 **/
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
	
	/**
	 * getStepCount function
	 *
	 * Calculates the number of steps of the type that has been calculated with this.getStepType there are in a timespan
	 *
	 * @param {number} timespan - A timespan between two dates (in miliseconds)
	 * @return {number} Number of steps within the timespan
	 **/ 
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
	
	/**
	 * getStepDivider function
	 * 
	 * The divider will be used to calculate widths.
	 *
	 * @param {number} timespan - A timespan between two dates (in miliseconds)
	 * @return {number} The number by which will be divided to get widths.
	 **/
	this.getStepDivider = function(timespan) {
		switch(this.getSetting("stepType")) {
			case "days":
				return 1000*60*60;	
			default:
				return 1000*60*60*24;
		}
	}
	
	/**
	 * getStepWidth function
	 *
	 * Calculates the width of a single step.
	 *
	 * @param {number} timespan - A timespan between two dates (in miliseconds)
	 * @return {number} The width of a single step
	 **/
	this.getStepWidth = function(timespan) {
		return 100/(timespan/this.getSetting("stepDivider"));
	}

	
	/**
	 * addItem function
	 *
	 * Adds a new item to the this.items collection
	 * Note: It will not be checked if the object contains all the required fields. You can replace this function for example if you want to load the items using AJAX.
	 * 
	 * An item should contain:
	 *
	 * name: The Name of the item
	 * start: A Date object for the date, when the item starts
	 * end: A Date object for the date, when the item ends
	 * [optional] barColor: The color of the timeline bar. If not defined, default color will be used
	 *
	 * @param {object} item - The new item
	 **/
	this.addItem = function(item) {
		this.items.push(item);
	}
	
	/**
	 * getSetting function
	 * 
	 * This function is to check, if a setting has been defined by the user. If not, default setting will be used.
	 *
	 * @param {string} name - The key of the setting
	 * @return {mixed} The setting, either from the this.userSettings collection or from this.defaultSettings
	 **/
	this.getSetting = function(name) {
		if(name in this.userSettings) {
			return this.userSettings[name];
		} else if (name in this.defaultSettings) {
			 return this.defaultSettings[name];
		} else return false;
	}
}