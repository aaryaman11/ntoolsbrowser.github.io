//Take from second solution to this question
//https://stackoverflow.com/questions/36219632/html5-canvas-scrolling-vertically-and-horizontally
import { DOM } from './DOM.js';

'use strict';
function CreateUI_SignalControl(canvas, d, onScrollCallback) {
  var ctx = canvas.getContext('2d');

  var signalUIControl = {};
  var data = d;
  let currentSignal = 0;
  let max = 0;
  let min = 0;

  let end = data[currentSignal].length;

  function swapSignal(d) {
    currentSignal += d;
    constectrodeIDs = Array.apply(null, DOM.electrodeMenu.options)
      .map(option => option.value);

    console.log(electrodeIDs[currentSignal + 1]);
    if (currentSignal < 0)
      currentSignal = 0;

    if (currentSignal == data.length)
      currentSignal = data.length - 1;

    // max = data[currentSignal][0];
    // min = data[currentSignal][0];

    // for(let i=0; i<end; i++){
    //   if(data[currentSignal][i] > max)
    //     max = data[currentSignal][i];

    //   if(data[currentSignal][i] < min)
    //     min = data[currentSignal][i];
    // }
    max = Math.max(...data[currentSignal].slice(0, end));
    min = Math.min(...data[currentSignal].slice(0, end));


    signalUIControl.HEIGHT = Math.abs(max) + Math.abs(min);
    signalUIControl.draw();
  };

  // the total area of our drawings, can be very large now
  signalUIControl.WIDTH = data[currentSignal].length;

  signalUIControl.draw = function () {

    requestAnimationFrame(function () {
      canvas.width = canvas.width;

      // move our context by the inverse of our scrollbars' left and top property
      ctx.setTransform(1, 0, 0, 1, -signalUIControl.scrollbars.left, -signalUIControl.scrollbars.top);

      // draw only the visible area

      var visibleLeft = signalUIControl.scrollbars.left;
      var visibleWidth = visibleLeft + canvas.width;
      // var visibleTop = signalUIControl.scrollbars.top
      // var visibleHeight = visibleTop + canvas.height;


      ctx.beginPath();
      let i = Math.floor(visibleLeft);
      ctx.moveTo(visibleLeft, (max + Math.abs(min)) - (data[currentSignal][i] - min));
      for (++i; i < visibleWidth; i++) {
        ctx.lineTo(i, (max + Math.abs(min)) - (data[currentSignal][i] - min));
        // console.log(`i = ${i}`);
        // console.log(`Max + Min: ${max + Math.abs(min)}`);
        // console.log(`(data[currentSignal][i] - min: ${data[currentSignal][i] - min}`);
        // console.log(`To: ${(max + Math.abs(min)) - (data[currentSignal][i] - min)}`);
      }
      ctx.stroke();
      // console.log(i);

      onScrollCallback(i);

      // draw our scrollbars on top if needed
      signalUIControl.scrollbars.draw();
    });
  }

  signalUIControl.scrollbars = function () {
    var scrollbars = {};
    // initial position
    scrollbars.left = 0;
    scrollbars.top = 0;
    // a single constructor for both horizontal and vertical	
    var ScrollBar = function (vertical) {
      var that = {
        vertical: vertical
      };

      that.left = vertical ? canvas.width - 10 : 0;
      that.top = vertical ? 0 : canvas.height - 10;
      that.height = vertical ? canvas.height - 10 : 5;
      that.width = vertical ? 5 : canvas.width - 10;
      that.fill = '#dedede';

      that.cursor = {
        radius: 5,
        fill: '#bababa'
      };
      that.cursor.top = vertical ? that.cursor.radius : that.top + that.cursor.radius / 2;
      that.cursor.left = vertical ? that.left + that.cursor.radius / 2 : that.cursor.radius;

      that.draw = function () {
        if (!that.visible) {
          return;
        }
        // remember to reset the matrix
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // you can give it any shape you like, all canvas drawings operations are possible
        ctx.fillStyle = that.fill;
        ctx.fillRect(that.left, that.top, that.width, that.height);
        ctx.beginPath();
        ctx.arc(that.cursor.left, that.cursor.top, that.cursor.radius, 0, Math.PI * 2);
        ctx.fillStyle = that.cursor.fill;
        ctx.fill();
      };
      // check if we're hovered
      that.isHover = function (x, y) {
        if (x >= that.left - that.cursor.radius && x <= that.left + that.width + that.cursor.radius &&
          y >= that.top - that.cursor.radius && y <= that.top + that.height + that.cursor.radius) {
          // we are so record the position of the mouse and set ourself as the one hovered
          scrollbars.mousePos = vertical ? y : x;
          scrollbars.hovered = that;
          that.visible = true;
          return true;
        }
        // we were visible last call and no wheel event is happening
        else if (that.visible && !scrollbars.willHide) {
          that.visible = false;
          // the signalUIControl should be redrawn
          return true;
        }
      }

      return that;
    };

    scrollbars.horizontal = ScrollBar(0);
    scrollbars.vertical = ScrollBar(1);

    scrollbars.hovered = null;
    scrollbars.dragged = null;
    scrollbars.mousePos = null;
    // check both of our scrollbars
    scrollbars.isHover = function (x, y) {
      return this.horizontal.isHover(x, y) || this.vertical.isHover(x, y);
    };
    // draw both of our scrollbars
    scrollbars.draw = function () {
      this.horizontal.draw();
      this.vertical.draw();
    };
    // check if one of our scrollbars is visible
    scrollbars.visible = function () {
      return this.horizontal.visible || this.vertical.visible;
    };
    // hide it...
    scrollbars.hide = function () {
      // only if we're not using the mousewheel or dragging the cursor
      if (this.willHide || this.dragged) {
        return;
      }
      this.horizontal.visible = false;
      this.vertical.visible = false;
    };

    // get the area's coord relative to our scrollbar
    var toAreaCoord = function (pos, scrollBar) {
      var sbBase = scrollBar.vertical ? scrollBar.top : scrollBar.left;
      var sbMax = scrollBar.vertical ? scrollBar.height : scrollBar.width;
      var areaMax = scrollBar.vertical ? signalUIControl.HEIGHT - canvas.height : signalUIControl.WIDTH - canvas.width;

      var ratio = (pos - sbBase) / (sbMax - sbBase);

      return areaMax * ratio;
    };

    // get the scrollbar's coord relative to our total area
    var toScrollCoords = function (pos, scrollBar) {
      var sbBase = scrollBar.vertical ? scrollBar.top : scrollBar.left;
      var sbMax = scrollBar.vertical ? scrollBar.height : scrollBar.width;
      var areaMax = scrollBar.vertical ? signalUIControl.HEIGHT - canvas.height : signalUIControl.WIDTH - canvas.width;

      var ratio = pos / areaMax;

      return ((sbMax - sbBase) * ratio) + sbBase;
    }

    scrollbars.scroll = function () {
      // check which one of the scrollbars is active
      var vertical = this.hovered.vertical;
      // until where our cursor can go
      var maxCursorPos = this.hovered[vertical ? 'height' : 'width'];
      var pos = vertical ? 'top' : 'left';
      // check that we're not out of the bounds
      this.hovered.cursor[pos] = this.mousePos < 0 ? 0 :
        this.mousePos > maxCursorPos ? maxCursorPos : this.mousePos;

      // seems ok so tell the signalUIControl we scrolled
      this[pos] = toAreaCoord(this.hovered.cursor[pos], this.hovered);
      // redraw everything
      signalUIControl.draw();
    }
    // because we will hide it after a small time
    scrollbars.willHide;
    // called by the wheel event
    scrollbars.scrollBy = function (deltaX, deltaY) {
      // it's not coming from our scrollbars
      this.hovered = null;
      // we're moving horizontally
      if (deltaX) {
        var newLeft = this.left + deltaX;
        // make sure we're in the bounds
        this.left = newLeft > signalUIControl.WIDTH - canvas.width ? signalUIControl.WIDTH - canvas.width : newLeft < 0 ? 0 : newLeft;
        // update the horizontal cursor
        this.horizontal.cursor.left = toScrollCoords(this.left, this.horizontal);
        // show our scrollbar
        this.horizontal.visible = true;
      }
      if (deltaY) {
        var newTop = this.top + deltaY;
        this.top = newTop > signalUIControl.HEIGHT - canvas.height ? signalUIControl.HEIGHT - canvas.height : newTop < 0 ? 0 : newTop;
        this.vertical.cursor.top = toScrollCoords(this.top, this.vertical);
        this.vertical.visible = true;
      }
      // if we were called less than the required timeout
      clearTimeout(this.willHide);
      this.willHide = setTimeout(function () {
        scrollbars.willHide = null;
        scrollbars.hide();
        signalUIControl.draw();
      }, 500);
      // redraw everything
      signalUIControl.draw();
    };

    return scrollbars;
  }();

  var mousedown = function (e) {
    // tell the browser we handle this
    e.preventDefault();
    // we're over one the scrollbars
    if (signalUIControl.scrollbars.hovered) {
      // new promotion ! it becomes the dragged one
      signalUIControl.scrollbars.dragged = signalUIControl.scrollbars.hovered;
      signalUIControl.scrollbars.scroll();
    }
  };

  var mousemove = function (e) {
    // check the coordinates of our canvas in the document
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    // we're dragging something
    if (signalUIControl.scrollbars.dragged) {
      // update the mouse position
      signalUIControl.scrollbars.mousePos = signalUIControl.scrollbars.dragged.vertical ? y : x;
      signalUIControl.scrollbars.scroll();
    } else if (signalUIControl.scrollbars.isHover(x, y)) {
      // something has changed, redraw to show or hide the scrollbar
      signalUIControl.draw();
    }
    e.preventDefault();
  };
  var mouseup = function () {
    // we dropped it
    signalUIControl.scrollbars.dragged = null;
  };

  var mouseout = function () {
    // we're out
    if (signalUIControl.scrollbars.visible()) {
      signalUIControl.scrollbars.hide();
      signalUIControl.scrollbars.dragged = false;
      signalUIControl.draw();
    }
  };

  var mouseWheel = function (e) {
    e.preventDefault();
    signalUIControl.scrollbars.scrollBy(e.deltaX, e.deltaY);
  };

  function keyDown(e) {
    e.preventDefault();
    if (e.code == 'ArrowDown')
      swapSignal(1);

    if (e.code == 'ArrowUp')
      swapSignal(-1);
  };

  canvas.addEventListener('mousemove', mousemove);
  canvas.addEventListener('mousedown', mousedown);
  canvas.addEventListener('mouseup', mouseup);
  canvas.addEventListener('mouseout', mouseout);
  canvas.addEventListener('wheel', mouseWheel);
  document.addEventListener('keydown', keyDown);

  signalUIControl.cleanUp = function () {
    canvas.removeEventListener('mousemove', mousemove);
    canvas.removeEventListener('mousedown', mousedown);
    canvas.removeEventListener('mouseup', mouseup);
    canvas.removeEventListener('mouseout', mouseout);
    canvas.removeEventListener('wheel', mouseWheel);
    document.removeEventListener('keydown', keyDown);
  };

  swapSignal(0);
  signalUIControl.draw();

  return signalUIControl;
}
//Draggable div element as from example:
//https://www.w3schools.com/howto/howto_js_draggable.asp
const CreateElectrodeSignalWindow = (data, onScrollCallback) => {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let signalUIControl = null;

  function close() {
    title.removeEventListener('mousedown', dragMouseDown);
    signalUIControl.cleanUp();
    document.getElementById("electrode-signal-window").remove();
  };

  let electrodeWindow = document.createElement("div");
  electrodeWindow.id = 'electrode-signal-window';
  electrodeWindow.style.cssText = `top: ${document.body.clientHeight - 510}px; left: 0px`;
  // electrodeWindow.style.width = `50%`;

  let title = document.createElement("div");
  title.id = 'electrode-signal-window-title';
  title.style.cssText = 'overflow: auto';

  let titleText = document.createElement("div");
  titleText.innerHTML = 'Electrode Signal';
  titleText.style.cssText = 'float: left;';

  let closeBtn = document.createElement("button");
  closeBtn.innerHTML = 'X';
  closeBtn.style.cssText = 'float: right;';
  closeBtn.onclick = close;

  title.appendChild(titleText);
  title.appendChild(closeBtn);

  electrodeWindow.appendChild(title);

  let signalCanvas = document.createElement('canvas');
  signalCanvas.style.cssText = 'display: block';
  signalCanvas.style.width = document.body.clientWidth + 'px';
  signalCanvas.style.height = '500px';
  // signalCanvas.style.width = "100%";

  signalCanvas.width = document.body.clientWidth;
  signalCanvas.height = 500;

  electrodeWindow.appendChild(signalCanvas);

  signalUIControl = CreateUI_SignalControl(signalCanvas, data, onScrollCallback);

  title.addEventListener('mousedown', dragMouseDown);

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener('mouseup', closeDragElement);
    // call a function whenever the cursor moves:
    document.addEventListener('mousemove', elementDrag);
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    electrodeWindow.style.top = (electrodeWindow.offsetTop - pos2) + "px";
    electrodeWindow.style.left = (electrodeWindow.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.removeEventListener('mouseup', closeDragElement);
    document.removeEventListener('mousemove', elementDrag);
  }

  document.body.appendChild(electrodeWindow);
};

export { CreateElectrodeSignalWindow };
