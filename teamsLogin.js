var teamsLogin = function(username, password, callback) { 
    //this should be a promise
    var myreq = new XMLHttpRequest();
    myreq.open('POST', 'https://my.austinisd.org/WebNetworkAuth/', false);

    myreq.setRequestHeader('Accept','*/*');
    
    myreq.setRequestHeader('Content-Type','application/x-www-form-urlencoded')
    myreq.send('cn=' + username + '&%5Bpassword%5D=' + password);
    console.log(myreq);
    chrome.cookies.getAll({ name:'CStoneSessionID'}, function(mycookie) { 
        var teams_cookie_req = new XMLHttpRequest();
        teams_cookie_req.open('POST','https://my-teams.austinisd.org/selfserve/EntryPointSignOnAction.do?parent=false',false);
        teams_cookie_req.withCredentials = true;
        teams_cookie_req.setRequestHeader('Accept','*/*');

        teams_cookie_req.setRequestHeader('Content-Type','application/x-www-form-urlencoded')
        chrome.cookies.set({url:'https://.austinisd.org',name:'CStoneSessionID',value:mycookie[0].value}, function(set_cstone_cookie) { 
          teams_cookie_req.send(null);
	  console.log(teams_cookie_req);
          chrome.cookies.getAll({domain:'my-teams.austinisd.org', name:'JSESSIONID'}, function(teamscookies){
            var teams_req = new XMLHttpRequest();
            teams_req.open('POST','https://my-teams.austinisd.org/selfserve/SignOnLoginAction.do', false);
            var i = teamscookies.length;
            teamscookies.forEach(function(teamscookie) {
              chrome.cookies.set({url:'https://my-teams.austinisd.org', name: 'JSESSIONID', value:teamscookie.value}, function(set_teams_cookie) { 
                i--;
                if(i === 0) { 
                  teams_req.setRequestHeader('Accept','*/*');
                  teams_req.setRequestHeader('Content-Type','application/x-www-form-urlencoded')
                  teams_req.withCredentials=true;
                  teams_req.send("userLoginId=" + username + "&userPassword=" + password);
		  console.log(teams_req);
                  callback(teams_req);
                }
	      }); 
            });
          });
        });
    });
}
