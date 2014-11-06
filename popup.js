var courses;
window.onload = function () {
  document.getElementById('button').onclick = function () {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var manaTEAMS = new ManaTEAMS(username);
    manaTEAMS.login(username, password, function(teams_req) {
      manaTEAMS.getGradesPage(teams_req, function(response) {
        var parser = new TEAMSParser(response);
        courses = parser.getAllGrades();
        document.getElementById("response").innerHTML = JSON.stringify(courses);
      });
    });
  }
}
