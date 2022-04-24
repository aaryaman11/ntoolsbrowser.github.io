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

    const mode = umbButton.checked ? 'demo' : 'build';
    const url = mode === 'demo' ?
      `../data/${subject}/JSON/${subject}.json`
      : `${protocol}//ievappwpdcpvm01.nyumc.org/?file=${subject}.json`;


    const request = new XMLHttpRequest();
    request.open('HEAD', url, false);
    request.send();
    if (request.status !== 404) {
      window.location.href = `./view.html?mode=${mode}&subject=${subject}`;
    }
    else {
      document.getElementById('err').innerText = 'Data not found!';
      console.log('Data not found!');
    }

    //const subject_id = document.getElementById('list').value;
    document.getElementById('fsaverage-demo').addEventListener('load', () => {
      window.location.href = `./view.html?mode=${mode}&subject=${subject}`;
    });
  }

});

// const urlExists = (url) => {
//   const request = new XMLHttpRequest();
//   request.open('HEAD', url, false);
//   request.send();
//   return request.status !== 404;
// }   