var response;
window.onload = function () {
  document.getElementById('button').onclick = function () {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    teamsLogin(username,password, function(req,cookie) { 
	response = new XMLHttpRequest();
	response.open('GET','https://my-teams.austinisd.org/selfserve/PSSViewReportCardsAction.do',false);
	response.withCredentials = true;
	response.setRequestHeader('Set-Cookie',cookie);
	response.send(null);
	document.getElementById("response").innerHTML = response.responseText;
    });
  }
}
