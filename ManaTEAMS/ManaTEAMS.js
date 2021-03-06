'use strict';

function ManaTEAMS(username, password) {
    this.username = username;
    this.password = password;
    this.isParent = username.search(/^[Ss]\d{7}\d?$/) === -1;
    if (this.isParent) {
        this.teamsHost = "https://grades.austinisd.org";
    } else {
        this.teamsHost = "https://grades.austinisd.org"
    }
    this.isLoggedIn = false;
}

ManaTEAMS.prototype.login = function(success, error) {
    var username = this.username;
    var password = this.password;
    var teamsHost = this.teamsHost;
    var isParent = this.isParent;
    //this should be a promise
    var myreq = new XMLHttpRequest();
    myreq.open('POST', 'https://my.austinisd.org/WebNetworkAuth/', false);
    myreq.setRequestHeader('Accept', '*/*');
    myreq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    myreq.send('cn=' + username + '&%5Bpassword%5D=' + password);
    chrome.cookies.getAll({
        name: 'CStoneSessionID'
    }, function(mycookie) {
        var teams_cookie_req = new XMLHttpRequest();
        teams_cookie_req.open('POST', teamsHost + '/selfserve/EntryPointSignOnAction.do?parent=' + isParent, true);
		teams_cookie_req.timeout = 10000; // TODO: tune this
        teams_cookie_req.withCredentials = true;
        teams_cookie_req.setRequestHeader('Accept', '*/*');
        teams_cookie_req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
        chrome.cookies.set({
            url: 'https://.austinisd.org',
            name: 'CStoneSessionID',
            value: mycookie[0].value
        }, function(set_cstone_cookie) {
			teams_cookie_req.onload = function(e) {
				if (teams_cookie_req.readyState === 4) {
					if (teams_cookie_req.status === 200) {
						chrome.cookies.getAll({
							domain: 'grades.austinisd.org',
							name: 'JSESSIONID'
						}, function(teamscookies) {
							var teams_req = new XMLHttpRequest();
							teams_req.open('POST', teamsHost + '/selfserve/SignOnLoginAction.do', false);
							var i = teamscookies.length;
							teamscookies.forEach(function(teamscookie) {
								chrome.cookies.set({
									url: teamsHost,
									name: 'JSESSIONID',
									value: teamscookie.value
								}, function(set_teams_cookie) {
									// Crappy fake async foreach
									i--;
									if (i === 0) {
										teams_req.setRequestHeader('Accept', '*/*');
										teams_req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
										teams_req.withCredentials = true;
										teams_req.send("userLoginId=" + username + "&userPassword=" + password);
										if (isParent) {
											var studentInfoLocID = TEAMSParser.parseStudentInfoLocID(teams_req.responseText);
											//TODO Hardcoded user index 0 for now
											var student_choice_request = new XMLHttpRequest();
											student_choice_request.open('POST', teamsHost + "/selfserve/ViewStudentListChangeTabDisplayAction.do", false);
											student_choice_request.setRequestHeader('Accept', '*/*');
											student_choice_request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
											student_choice_request.withCredentials = true;
											student_choice_request.send("selectedIndexId=0&studentLocId=" + studentInfoLocID + "&selectedTable=table");
											this.isLoggedIn = true;
                                            success("&selectedIndexId=0&studentLocId=" + studentInfoLocID + "&selectedTable=table", 'success');
										} else {
                                            this.isLoggedIn = true;
											success(null, 'success');
										}
									}
								});
							});
						});
					} else {
						error('wrong credentials');
					}
				}
			};
			teams_cookie_req.onerror = function(e) {
				error('wrong credentials')
			};
			teams_cookie_req.ontimeout = function() {
				error('timeout')
			};
            teams_cookie_req.send(null);
        });
    });
}

ManaTEAMS.prototype.getGradesPage = function(callback) {
    var response = new XMLHttpRequest();
    response.open('GET', this.teamsHost + '/selfserve/PSSViewReportCardsAction.do', false);
    response.withCredentials = true;
    response.send(null);
    callback(response.responseText, (response.responseText.indexOf('Forbidden') !== -1) ? "Not logged in" : null);
}

ManaTEAMS.prototype.getAllCourses = function(callback) {
    this.getGradesPage(function(html, error) {
        if (!error) {
            var parser = new TEAMSParser(html);
            parser.parseAverages(function(courses) {
                callback(html, courses);
            })
        }
    });
}

//must be logged in for following functions
ManaTEAMS.prototype.getCycleClassGrades = function(courseId, cycle, semester, averagesHtml, callback) {
    var coursehtmlnode = TEAMSParser.getCourseElement(averagesHtml, courseId, cycle);
    var gradeBookKey = "selectedIndexId=-1&smartFormName=SmartForm&gradeBookKey=" + encodeURIComponent(coursehtmlnode.find("a")[0].id);
    var coursehtml = this.getTEAMSPage("/selfserve/PSSViewGradeBookEntriesAction.do", gradeBookKey);
    //TODO hardcoded number of cycles
    var parser = new TEAMSParser(coursehtml);
    callback(parser.parseClassGrades(courseId, semester, cycle));
}

ManaTEAMS.prototype.getTEAMSPage = function(path, gradeBookKey) {
    var response = new XMLHttpRequest();
    response.open('POST', this.teamsHost + path, false);
    response.withCredentials = true;
    response.setRequestHeader('Accept', '*/*');
    response.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    response.send(gradeBookKey);
    return response.responseText;
}
