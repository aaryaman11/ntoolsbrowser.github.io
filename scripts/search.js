'use strict';
(main => {
  document.readyState == 'complete' ? 
  main() 
: window.addEventListener('load', main)
})(() => {
  document.getElementById('submitbtn').onclick = () => {
    const subject = document.getElementById('search-bar').value;
    const umbButton = document.getElementById('umb-rad-button');
    const protocol = window.location.protocol;
                      
    const mode = umbButton.checked ? 'umb' : 'nyu';
    const url = mode === 'umb' ?
      `../data/JSON/sample.json`
    : `${protocol}//ievappwpdcpvm01.nyumc.org/?file=${subject}.json`;
    
    
    const request = new XMLHttpRequest();
    request.open('HEAD', url, false);
    request.send();
    if (request.status !== 404) {
      window.location.href = `../index.html?mode=${mode}&subject=${subject}`;
    }
    else {
      document.getElementById('err').innerText = 'Data not found!';
      console.log('Data not found!');                
    }
  }
});

// const urlExists = (url) => {
//   const request = new XMLHttpRequest();
//   request.open('HEAD', url, false);
//   request.send();
//   return request.status !== 404;
// }   