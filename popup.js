var courseObj;
var courseOne;
window.onload = function() {
    document.getElementById('button').onclick = function() {
        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;
        var manaTEAMS = new ManaTEAMS(username);
        manaTEAMS.login(username, password, function() {
            manaTEAMS.getAllCourses(function(html, courses) {
                courseObj = courses; 
                courseOne = manaTEAMS.getCycleClassGrades(courses[1].courseId, 1, html)
                document.getElementById("response").innerHTML = JSON.stringify(courses);
            });
        });
    }
    document.getElementById('button2').onclick = function() {
        ManaTEAMS.getGradesPage(function(html, error) {
            document.getElementById("response").innerHTML = error || "Logged In!";
        })
    }
}
