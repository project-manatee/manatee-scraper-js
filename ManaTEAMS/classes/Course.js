function Course (title, teacher, teacherEmail, courseId, semesters) {
	this.title = title;
	this.teacher = teacher;
	this.teacherEmail = teacherEmail || ''; 
	this.courseId = courseId || '';
	this.semesters = semesters;
}

