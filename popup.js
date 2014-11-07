var courses;
var courseOne;
window.onload = function() {
    document.getElementById('button').onclick = function() {
        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;
        var manaTEAMS = new ManaTEAMS(username);
        manaTEAMS.login(username, password, function(teams_req) {
            manaTEAMS.getGradesPage(teams_req, function(html) {
                var parser = new TEAMSParser(html);
                courses = parser.parseAverages(function(newcourses) {
                    courses = newcourses;
                    courseOne = manaTEAMS.getCycleClassGrades(newcourses[1].courseId, 1, html)
                    document.getElementById("response").innerHTML = JSON.stringify(courses);
                });

            });
        });
    }
    document.getElementById('button2').onclick = function() {
        ManaTEAMS.isLoggedIn(function(html, isLoggedIn) {
            document.getElementById("response").innerHTML = isLoggedIn;
        })
    }
}