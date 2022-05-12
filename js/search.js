'use strict';
(main => {
  document.readyState == 'complete' ?
    main()
    : window.addEventListener('load', main)
})(() => {
  document.getElementById('submitbtn').addEventListener('click',
    async (e) => {
      e.preventDefault();
      const subject = document.getElementById('search-bar').value;
      const protocol = window.location.protocol;
      const baseURL = `ievappwpdcpvm01.nyumc.org/?bids=ieeg&file=sub-${subject}`

      await fetch(`${protocol}//${baseURL}_ntoolsbrowser.json`)
        .then(() => {
          window.location.href = `./view.html?mode=build&subject=${subject}`;
        })
        .catch((error) => {
          const errorText = document.getElementById('err');
          alert(`${error} ${subject}`);
          console.log(error);
          errorText.innerText = 'Data not found!';
          setTimeout(() => {
            errorText.innerText = '';
          }, 3000);
        });
    });

  const subjectList = document.getElementById('list')
  subjectList.addEventListener('change', () => {
    if (subjectList.selectedIndex > 0) {
      window.location.href = `./view.html?mode=demo&subject=${subjectList.value}`;
    }
  });
});
