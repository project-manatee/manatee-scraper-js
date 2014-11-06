function ClassGrades (title, urlHash, period, semesterIndex, cycleIndex, average, categories) {
	this.urlHash = urlHash;
	this.period = period;
	this.semesterIndex = semesterIndex;
	this.cycleIndex = cycleIndex;
	this.average = average; 
	this.title = title;
	this.categories = categories;
}

ClassGrades.prototype.getGradeForCycle = function(period) { 
	return this.grades[period].average || 'NG'; 
}
