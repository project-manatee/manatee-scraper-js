function TEAMSParser (htmlString) {
	this.dom = $('<html />').html(htmlString);
}


TEAMSParser.prototype.getAllGrades = function() { 
		var metadataTable = this.dom.find('#finalTablebotLeft1')
									.find('#tableHeaderTable');
		var metadataRows = metadataTable.find('tr');
		var gradeTable = this.dom.find('#finalTablebottomRight1')
								 .find('#tableHeaderTable');
		var gradeRows = gradeTable.find('tr');

		//make this mutable
		var semParams = {};
		semParams['cyclesPerSemester'] = 3;
		semParams['hasExams'] = true;
		semParams['hasSemesterAverages'] = true;
		semParams['semesters'] = 2;

		var courses = [];
		// parse each course (ignore the first row as it is headers)
		for (var i = 1; i < metadataRows.length; i++) {
			courses[i - 1] = this.parseCourse($(metadataRows[i]), $(gradeRows[i]), semParams);
		}

		return courses;
}

TEAMSParser.prototype.parseCourse = function (metadataRow, gradeRow, semParams) {
	// find the cells in this row
	var metadataCells = metadataRow.find("td");
	var gradeCells = gradeRow.find("td");

	// find the teacher name and email
	var teacherCell = metadataCells[2];

	// get the course number
	var courseId = $(metadataCells[0]).text();

	// parse semesters
	var semesters = [];
	for (var i = 0; i < semParams.semesters; i++) {
		// get cells for the semester
		var semesterCells = [];
		var cellOffset = i * (semParams.cyclesPerSemester
							+ (semParams.hasExams ? 1 : 0) 
							+ (semParams.hasSemesterAverages ? 1 : 0));

		// find the cycle cells for this semester
		for (var j = 0; j < semParams.cyclesPerSemester; j++)
			semesterCells[j] = $(gradeCells[cellOffset + j]);

		// exam cell is after that
		var examCell = semParams.hasExams ? $(gradeCells[cellOffset + semParams.cyclesPerSemester]) : null;

		// and semester cell is after that
		var semAvgCell = semParams.hasSemesterAverages ? 
						$(gradeCells[cellOffset + semParams.cyclesPerSemester + (semParams.hasExams ? 1 : 0)]) : null;

		// parse the semester
		semesters[i] = this.parseSemester(semesterCells, examCell,
				semAvgCell, i, semParams);
	}

	// create the course
	var course = new Course($(metadataCells[3]).text(), 
							$(teacherCell).text(), 
							'', 
							courseId, 
							semesters);
	return course;
}

TEAMSParser.prototype.parseSemester = function (cycles, exam, semAvg, index, semParams) {
	var parsedCycles = [];
	for (var i = 0; i < semParams.cyclesPerSemester; i++) {
		parsedCycles[i] = this.parseCycle($(cycles[i]), i);
	}

	var examGrade;
	if (semParams.hasExams) {
		var examText = exam.text();
	} else {
		examGrade = '';
	}

	var semester = new Semester(index,
								'', //semAverage goes here
								examGrade,
								parsedCycles);


	if (semParams.hasSemesterAverages) {
		//not checking if it's a letter
		var parsedSemAvg = $(semAvg).text();
		semester.average = parsedSemAvg 
		//TODO calculate average
	}

	return semester;
}

TEAMSParser.prototype.parseCycle = function(cell, index) {
	var link = cell.find("a");
	var isNumber = !isNaN(link.text());
	if (!isNumber) {
		var cycle = new Cycle(index);
		return cycle;
	}

	var average = link.text();
	var cycle = new Cycle(index, 
						  average,
						  '' //urlHash should go here
						  );
	return cycle;
}