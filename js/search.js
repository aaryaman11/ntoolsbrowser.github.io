'use strict';
(main => {
  document.readyState == 'complete' ?
    main()
    : window.addEventListener('load', main)
})(() => {
  document.getElementById('submitbtn').onclick = () => {
    const subject = document.getElementById('search-bar').value;
    const protocol = window.location.protocol;
    const url = `${protocol}//ievappwpdcpvm01.nyumc.org/?file=${subject}.json`;

    if (urlExists(url)) {
      window.location.href = `./view.html?mode=build&subject=${subject}`;
    }
    else {
      document.getElementById('err').innerText = 'Data not found!';
      console.log('Data not found!');
    }
  }
  const subject_list = document.getElementById('list')
  subject_list.addEventListener('change', () => {
    if (subject_list.selectedIndex > 0) {
      window.location.href = `./view.html?mode=demo&subject=${subject_list.value}`;
    }
  });

});

const urlExists = (url) => {
  const request = new XMLHttpRequest();
  request.open('HEAD', url, false);
  request.send();
  return request.status !== 404;
}   