function TEAMSParser(htmlString) {
    this.dom = $('<html />').html(htmlString);
}

TEAMSParser.NUMERIC_REGEX = function() {
    return /(\d+)/g
};
TEAMSParser.EXTRA_CREDIT_REGEX = function() {
    return /^extra credit$|^ec$/ig
};
TEAMSParser.EXTRA_CREDIT_NOTE_REGEX = function() {
    return /extra credit/ig
};


TEAMSParser.parseStudentInfoLocID = function(responseHtml) {
	var dom = $('<html />').html(responseHtml);
	var studentTable = dom.find('#tableBodyTable');
	return studentTable.find('tr').attr('locid');
}


TEAMSParser.getCourseElement = function(averagesHtml, courseId, cycle) {
    var dom = $('<html />').html(averagesHtml);
    // Define Grade/Metadata Table
    var metadataTable = dom.find("#finalTablebotLeft1")
        .find("#tableHeaderTable");
    var metadataRows = metadataTable.find("tr");
    var gradeTable = dom.find("#finalTablebottomRight1").find("#tableHeaderTable");
    var gradeRows = gradeTable.find("tr");
    var rownum = 0;
    for (var i = 1; i < metadataRows.length; i++) {
        var metadataCells = $(metadataRows[i]).find("td");
        if (courseId === $(metadataCells[0]).text()) {
            rownum = i;
            break;
        }
    }
    //get the same row in the grades table
    var newCourse = $(gradeRows[rownum]).find("td");
    return (cycle < 3) ? $(newCourse[cycle]) : $(newCourse[cycle + 2]);
};

TEAMSParser.prototype.parseClassGrades = function(courseId, semesterIndex, cycleIndex) {
    // get categories
    var categoriesDiv = this.dom.find("#pssViewGradeBookEntriesDiv");
    var categories = categoriesDiv.children();
    //Split <br> for category info later
    categoriesDiv.children("br").append("split");
    var gradeInfo = $(this.dom.find(".studentAttendance").find("tr")[2]).find("td");
    // parse category average
    if (gradeInfo.length < 4) {
        //No grades yet
        return null;
    }
    var averageMatcher = TEAMSParser.NUMERIC_REGEX().exec($(gradeInfo[3]).text());
    var periodMatcher = TEAMSParser.NUMERIC_REGEX().exec($(gradeInfo[1]).text());
    // parse categories
    var cats = [];
    for (var i = 0; i < categories.length; i++) {
        cats[i] = this.parseCategory(
            $($(categories[i]).find("div")[0]),
            courseId);
    }

    // return class grades
    var grades = new ClassGrades($(gradeInfo[0]).text().split("-")[1].trim(), // Get name from CLASS ID - Name format
        '',
        periodMatcher[0],
        semesterIndex,
        cycleIndex,
        averageMatcher[0],
        cats);
    return grades;
};


TEAMSParser.prototype.parseCategory = function(cat, courseId) {
    // Try to retrieve a weight for each category. Since we have to support
    // IB-MYP grading,
    // category weights are not guaranteed to add up to 100%. However,
    // regardless of which
    // weighting scheme we are using, grade calculations should be able to
    // use the weights
    // as they are parsed below.
    //Get category info out of <br> tags

    //0=Title, 1=Average, 2=Weight
    var catInfo = cat.find("h1").text().split("split");
    var realCatInfo = [];
    realCatInfo[0] = catInfo[0].substring(0, catInfo[0].indexOf('Average'));
    realCatInfo[1] = catInfo[0].substring(catInfo[0].indexOf('Average'), catInfo[0].indexOf('Weight'));
    realCatInfo[2] = catInfo[0].substring(catInfo[0].indexOf('Weight'));
    // Some teachers don't put their assignments out of 100 points. Check if
    // this is the case.
    var is100Pt = cat.find("[columnId='Grade Scale']").length === 0;

    var categoryTableId = (realCatInfo[0].trim().replace(/ /g, "_") + "BodyTable").trim();
    // Find all of the assignments using category name since assginment table id is CategoryName + "BodyTable"
    var assignments = cat.find("[id='" + categoryTableId + "']").find("tr");
    // parse category average
    var averageMatcher = TEAMSParser.NUMERIC_REGEX().exec(realCatInfo[1]);
    // parse class weight
    var weightdMatcher = TEAMSParser.NUMERIC_REGEX().exec(realCatInfo[2]);
    // generate category ID
    var catId = Sha1.hash(courseId + '|' + realCatInfo[0].trim());
    // parse assignments
    var parsedAssignments = [];
    for (var i = 0; i < assignments.length; i++) {
        parsedAssignments[i] = this.parseAssignment($(assignments[i]), is100Pt,
            catId);
    }

    var newCat = new Category(catId,
        realCatInfo[0].trim(),
        weightdMatcher[0] || null,
        averageMatcher[0] || null,
        '', // cat.bonus = GradeCalc.categoryBonuses(assignments);
        // TODO fix this
        parsedAssignments);
    return newCat;
};

TEAMSParser.prototype.parseAssignment = function(row, is100Pt, catId) {
    var cells = row.find("td");
    // Format - 0= Title 1= pts earned 2=Assign Date 3= Due Date 4 = scale 5=Max Val 6=Count 7=Note
    var title = $(cells[0]).text();
    var dateDue = $(cells[3]).text();
    var dateAssigned = $(cells[2]).text();
    //idk if this avoids exceptions
    var note = (cells.length === 7) ? '' : $(cells[7]).text() || '';
    var ptsEarned = $(cells[1]).text();
    var regexp = new RegExp("^(.*?)\\(.*$");
    var match = regexp.exec(ptsEarned);
    if (match != null){
        ptsEarned = match[1].trim();
    }
    else {
        ptsEarned =  $(cells[1]).text();
    }
    var ptsPossNum = isNaN($(cells[4]).text()) ?
        100 :
        $(cells[4]).text();

    // Retrieve both the points earned and the weight of the assignment.
    // Some teachers
    // put in assignments with weights; if so, they look like this:
    // 88x0.6
    // 90x0.2
    // 100x0.2
    // The first number is the number of points earned on the assignment;
    // the second is
    // the weight of the assignment within the category.
    // If the weight is not specified, it is assumed to be 1.
    var ptsEarnedNum;
    var weight;
    if (ptsEarned.indexOf("x") !== -1) {
        var ptsSplit = ptsEarned.split("x");
        ptsEarnedNum = ptsSplit[0];
        weight = ptsSplit[1] || 1;
    } else {
        ptsEarnedNum = ptsEarned;
        weight = 1;
    }
    // turn points earned into grade value
    var grade;
    if (ptsEarnedNum === null) {
        grade = ptsEarned;
    } else {
        grade = (ptsEarnedNum / ptsPossNum) * 100;
    }

    // generate the assignment ID
    var assignmentId = Sha1.hash(catId + '|' + title);

    // Guess if the assignment is extra credit or not. GradeSpeed doesn't
    // exactly
    // just tell us if an assignment is extra credit or not, but we can
    // guess
    // from the assignment title and the note attached.
    // If either contains something along the lines of 'extra credit', we
    // assume
    // that it is extra credit.
    var extraCredit = title.search(TEAMSParser.EXTRA_CREDIT_REGEX()) !== -1 || note.search(TEAMSParser.EXTRA_CREDIT_NOTE_REGEX()) !== -1;

    // return an assignment
    var assignment = new Assignment(assignmentId,
        title,
        dateAssigned,
        dateDue,
        grade,
        ptsPossNum,
        weight,
        note,
        extraCredit);
    return assignment;
};

TEAMSParser.prototype.parseAverages = function(callback) {
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

    callback(courses);
};

TEAMSParser.prototype.parseCourse = function(metadataRow, gradeRow, semParams) {
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
        var cellOffset = i * (semParams.cyclesPerSemester + (semParams.hasExams ? 1 : 0) + (semParams.hasSemesterAverages ? 1 : 0));

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
};

TEAMSParser.prototype.parseSemester = function(cycles, exam, semAvg, index, semParams) {
    var parsedCycles = [];
    for (var i = 0; i < semParams.cyclesPerSemester; i++) {
        parsedCycles[i] = this.parseCycle($(cycles[i]), i);
    }

    var examGrade;
    if (semParams.hasExams) {
        examGrade = exam.text();
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
};

TEAMSParser.prototype.parseCycle = function(cell, index) {
    var link = cell.find("a");
    var isNumber = !isNaN(link.text());
    if (!isNumber) {
        var cycle = new Cycle(index);
        return cycle;
    }

    var average = link.text();
    var newCycle = new Cycle(index,
        average,
        '' //urlHash should go here
    );
    return newCycle;
};
