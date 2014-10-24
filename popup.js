var req;
window.onload = function () {
  document.getElementById('button').onclick = function () {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    req = new XMLHttpRequest();
    req.open('POST', 'https://my.austinisd.org/WebNetworkAuth/', false);
    req.setRequestHeader('Accept','*/*');
    req.setRequestHeader('Content-Type','application/x-www-form-urlencoded')
    
    req.send('cn=' + username + '&%5Bpassword%5D=' + password);
    var headers = req.getAllResponseHeaders().toLowerCase();
    chrome.cookies.getAll({ name:'CStoneSessionID'}, function(mycookie) { 
    	console.log(mycookie[0]);
	req.open('GET','https://my-teams.austinisd.org/selfserve/EntryPointSignOnAction.do?parent=false',false);
	req.withCredentials = true;
	req.setRequestHeader('Set-Cookie','CStoneSessionID='+mycookie[0].value);
	req.send('');
	chrome.cookies.getAll({domain:'my-teamsselfserve.austinisd.org', name:'JSESSIONID'}, function(teamscookie){
	  console.log(teamscookie);
	  req.open('POST','https://my-teams.austinisd.org/selfserve/EntryPointSignOnAction.do?parent=false', false);
	  var reqcookie = 'CStoneSessionID='+mycookie[0].value+'; ';  
	  for(var i = 0; i < teamscookie.length; i++) {
	    reqcookie+= 'JSESSIONID='+teamscookie[i].value+'; ';
	  }
	  console.log(reqcookie);
	  req.setRequestHeader('Set-Cookie',reqcookie);
	  req.send("userLoginId=" + username + "&userPassword=" + password);
	  req.open('GET','https://my-teams.austinisd.org/selfserve/PSSViewReportCardsAction.do',false);
	  req.send(null);

	});
    });
  }
}
