    // if (mode === "UMB") {
    //     volume.file = `../${subject}/${subject}_T1.nii`;
    //     volume.labelmap.file = `../${subject}/${subject}_default_labels.nii`

    // } else {
    //     volume.file = window.location.protocol+`//ievappwpdcpvm01.nyumc.org/?file=${subject}_T1.nii`
    //     volume.labelmap.file = window.location.protocol+`//ievappwpdcpvm01.nyumc.org/?file=${subject}_default_labels.nii`
    // }

    // volume.labelmap.colortable.file = `./colormap_seiztype.txt`



    //   // from http://stackoverflow.com/a/7826782/1183453
    //   var args = document.location.search.substring(1).split('&');
    //   argsParsed = {};
    //   for (var i=0; i < args.length; i++)
    //   {
    //       arg = unescape(args[i]);

    //       if (arg.length == 0) {
    //         continue;
    //       }

    //       if (arg.indexOf('=') == -1)
    //       {
    //           argsParsed[arg.replace(new RegExp('/$'),'').trim()] = true;
    //       }
    //       else
    //       {
    //           kvp = arg.split('=');
    //           argsParsed[kvp[0].trim()] = kvp[1].replace(new RegExp('/$'),'').trim();
    //       }
    //   }
    
    // mode = argsParsed['mode'];
    // subject = argsParsed['subject'];

    // destructure array of renderers
    

    //  if (selectedSeizType === "intPopulation") {
    //         intPopList.style.visibility = 'visible'
    //         seizTypeList.style.visibility = 'hidden'

    //         volume.labelmap.file = mode === "UMB" ? `../${subject}/${subject}_intPopulation_labels.nii`
    //                                               : window.location.protocol+`//ievappwpdcpvm01.nyumc.org/?file=${subject}_intPopulation_labels.nii`

    //         volume.labelmap.colortable.file = './colormap_intpop.txt'
    //       } else {
    //         seizTypeList.style.visibility = 'visible'
    //         intPopList.style.visibility = 'hidden'
    //         volume.labelmap.file = mode === "UMB" ? `../${subject}/${subject}_${selectedSeizType}_labels.nii`
    //                                               : window.location.protocol+`//ievappwpdcpvm01.nyumc.org/?file=${subject}_${selectedSeizType}_labels.nii`
    //         volume.labelmap.colortable.file = './colormap_seiztype.txt'
    //       }



  // X.io.load('../data/T1_RAS.nii')

  // X.io.oncomplete = function() {
  //     var input = X.io.get('../data/T1_RAS.nii')
  //     new SIMPLEVIEWER('sliceX', input.header.dim.subarray(1,4), input.data.image);
  // }