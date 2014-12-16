var courseObj;
var courseOne;
window.onload = function() {
    document.getElementById('button').onclick = function() {
        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;
        var manaTEAMS = new ManaTEAMS(username, password);
        manaTEAMS.login(function() {
            console.log('loggedin');
            manaTEAMS.getAllCourses(function(html, courses) {
                document.getElementById("response").innerHTML = html;
                courseObj = courses; 
                manaTEAMS.getCycleClassGrades(courses[1].courseId, 1, 0, html, function(courseOneret) {
                    courseOne = courseOneret;
                });
                document.getElementById("response").innerHTML = JSON.stringify(courses);
            });
        });
    }
    document.getElementById('button2').onclick = function() {
        var manaTEAMS = new ManaTEAMS(document.getElementById('username').value, document.getElementById('password').value);
        manaTEAMS.getGradesPage(function(html, error) {
            document.getElementById("response").innerHTML = error || "Logged In!";
        })
    }
}
