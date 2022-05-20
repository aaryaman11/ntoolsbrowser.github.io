'use strict';
(main => {
  document.readyState == 'complete' ?
    main()
    : window.addEventListener('load', main)
})(() => {
  // code for handling the form submission to load a subject
  document.getElementById('submitbtn').addEventListener('click',
    async (e) => {
      e.preventDefault();
      const subject = document.getElementById('search-bar').value;
      const protocol = window.location.protocol;
      const baseURL = `ievappwpdcpvm01.nyumc.org/?bids=ieeg&file=sub-${subject}`

      // query server to see if the data actually exists
      await fetch(`${protocol}//${baseURL}_ntoolsbrowser.json`)
        .then(() => {
          window.location.href = `./view.html?mode=build&subject=${subject}`;
        })
        .catch((error) => {
          const errorText = document.getElementById('err');
          console.error(`${error} ${subject}`);
          errorText.innerText = 'Data not found!';
          setTimeout(() => {
            errorText.innerText = '';
          }, 3000);
        });
    });

  // change to the selected demo subject
  const subjectList = document.getElementById('list')
  subjectList.addEventListener('change', () => {
    if (subjectList.selectedIndex > 0) {
      window.location.href = `./view.html?mode=demo&subject=${subjectList.value}`;
    }
  });

  document.body.addEventListener('drop', (e) => {
    // stop browser processing right away
    e.stopPropagation();
    e.preventDefault();

    const file = e.dataTransfer.files[0];

    // this will extract the name of the subject from the JSON if a user drags one
    const fileTokens = [...file.name.matchAll("[a-zA-Z0-9]+")];
    const subject = fileTokens[0][0] === 'sub' 
      ? fileTokens[1][0] 
      : fileTokens[0][0];
    const reader = new FileReader();

    reader.onloadend = (event) => {
      const result = JSON.parse(event.target.result);
      sessionStorage.setItem("draggedJSON", JSON.stringify(result));
      window.location.href = `./view.html?mode=demo&subject=${subject}`;
    }

    reader.readAsText(file);
  });

  document.body.addEventListener('dragover', (e) => {
    e.stopPropagation();
    e.preventDefault();
  })
});
