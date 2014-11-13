'use strict';

function ManaTEAMS(username) {
    this.username = username;
    this.isParent = username.search(/^[Ss]\d{7}\d?$/) === -1;
}

ManaTEAMS.prototype.login = function(username, password, callback) {
    var username = username || this.username;
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
        teams_cookie_req.open('POST', 'https://my-teams.austinisd.org/selfserve/EntryPointSignOnAction.do?parent=' + this.isParent, false);
        teams_cookie_req.withCredentials = true;
        teams_cookie_req.setRequestHeader('Accept', '*/*');
        teams_cookie_req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
        chrome.cookies.set({
            url: 'https://.austinisd.org',
            name: 'CStoneSessionID',
            value: mycookie[0].value
        }, function(set_cstone_cookie) {
            teams_cookie_req.send(null);
            chrome.cookies.getAll({
                domain: 'my-teams.austinisd.org',
                name: 'JSESSIONID'
            }, function(teamscookies) {
                var teams_req = new XMLHttpRequest();
                teams_req.open('POST', 'https://my-teams.austinisd.org/selfserve/SignOnLoginAction.do', false);
                var i = teamscookies.length;
                teamscookies.forEach(function(teamscookie) {
                    chrome.cookies.set({
                        url: 'https://my-teams.austinisd.org',
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
                            callback();
                        }
                    });
                });
            });
        });
    });
}

ManaTEAMS.getGradesPage = function(callback) {
    var response = new XMLHttpRequest();
    response.open('GET', 'https://my-teams.austinisd.org/selfserve/PSSViewReportCardsAction.do', false);
    response.withCredentials = true;
    response.send(null);
    callback(response.responseText, 
             (response.responseText.indexOf('Forbidden') !== -1) ? "Not logged in" : null );
}

ManaTEAMS.prototype.getAllCourses = function(callback) {
    ManaTEAMS.getGradesPage(function(html, error) {
        if(!error) {
	     var parser = new TEAMSParser(html);
	     parser.parseAverages(function(courses) { 
                  callback(html, courses);
	     })
	}
    });
}

//must be logged in for following functions
ManaTEAMS.prototype.getCycleClassGrades = function(courseId, cycle, averagesHtml, cookies) {
    var coursehtmlnode = TEAMSParser.getCourseElement(averagesHtml, courseId, cycle);

    var gradeBookKey = "selectedIndexId=-1&smartFormName=SmartForm&gradeBookKey=" + encodeURIComponent(coursehtmlnode.find("a")[0].id);
    var coursehtml = this.getTEAMSPage("/selfserve/PSSViewGradeBookEntriesAction.do", gradeBookKey, cookies);
    //TODO hardcoded number of cycles
    var parser = new TEAMSParser(coursehtml);
    return parser.parseClassGrades(courseId, cycle < 3 ? 0 : 1, cycle);
}

ManaTEAMS.prototype.getTEAMSPage = function(path, gradeBookKey, userIdentification) {
    var response = new XMLHttpRequest();
    response.open('POST', 'https://my-teams.austinisd.org' + path, false);
    response.withCredentials = true;
    response.setRequestHeader('Accept', '*/*');
    response.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    response.send(gradeBookKey);
    return response.responseText;
}
