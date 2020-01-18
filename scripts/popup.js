(function (ls) {
  'use strict';

  function initializePopup() {

    // Register filter URL listener
    $('#filter_textbox')
      .val(ls.filter_url)
      .on('change', function () {
        ls.filter_url = $.trim(this.value);
      });

    chrome.downloads.onDeterminingFilename.addListener(suggestNewFilename);

    $('#btn-download').on('click', downloadImages);

    if (ls.show_url_filter === 'true') {
      $('#filter_textbox').on('keyup', filterImages);
    }


    $('#label-select-all').on('change', '#checkbox-select-all', function () {
      $('#btn-download').prop('disabled', !this.checked);
      for (let i = 0; i < visibleImages.length; i++) {
        $('#image' + i).toggleClass('checked', this.checked);
      }
    })

    $('#images-container').on('click', '.image-cards', function () {
      $(this).toggleClass('checked', !$(this).hasClass('checked'));

      let allAreChecked = true;
      let allAreUnchecked = true;
      for (let i = 0; i < visibleImages.length; i++) {
        if ($('#image' + i).hasClass('checked')) {
          allAreUnchecked = false;
        }
        else {
          allAreChecked = false;
        }
        // Exit the loop early
        if (!(allAreChecked || allAreUnchecked)) break;
      }

      $('#btn-download').prop('disabled', allAreUnchecked);

      let inputSelectAll = $('#checkbox-select-all');
      inputSelectAll.prop('indeterminate', !(allAreChecked || allAreUnchecked));
      if (allAreChecked) {
        inputSelectAll.prop('checked', true);
      }
      else if (allAreUnchecked) {
        inputSelectAll.prop('checked', false);
      }
    })
      .on('click', '.btn-download-img', function () {
        chrome.downloads.download({ url: $(this).data('url') });
      })
      .on('click', '.btn-open-img', function () {
        chrome.tabs.create({ url: $(this).data('url'), active: false });
      });

    // Get images on the page
    chrome.windows.getCurrent(function (currentWindow) {
      chrome.tabs.query({ active: true, windowId: currentWindow.id }, function (activeTabs) {
        chrome.tabs.executeScript(activeTabs[0].id, { file: '/scripts/send_images.js', allFrames: true });
      });
    });
  }

  function suggestNewFilename(item, suggest) {
    suggest({ filename: ls.folder_name + item.filename });
  }

  var allImages = [];
  var visibleImages = [];
  var linkedImages = {};

  // Add images to `allImages` and trigger filtration
  // `send_images.js` is injected into all frames of the active tab, so this listener may be called multiple times
  chrome.runtime.onMessage.addListener(function (result) {
    $.extend(linkedImages, result.linkedImages);
    for (let i = 0; i < result.images.length; i++) {
      if (allImages.indexOf(result.images[i]) === -1) {
        allImages.push(result.images[i]);
      }
    }
    filterImages();
  });

  var timeoutID;
  function filterImages() {
    clearTimeout(timeoutID); // Cancel pending filtration
    timeoutID = setTimeout(function () {
      // Copy all images initially
      visibleImages = allImages.slice(0);

      if (ls.show_url_filter === 'true') {
        let filterValue = $('#filter_textbox').val();
        if (filterValue && ls.filter_url_mode === 'regex') {
          visibleImages = visibleImages.filter(function (url) {
            try {
              return url.match(filterValue);
            }
            catch (e) {
              return false;
            }
          });
        }
      }

      displayImages();
    }, 200);
  }

  function displayImages() {
    $('#btn-download').prop('disabled', true);

    let imagesContainer = $('#images-container').empty();

    let labelForSelectAll = $('#label-select-all').empty();
    let inputSelectAll = '<input type="checkbox" id="checkbox-select-all" />Select all (' + visibleImages.length + ')</label>';
    labelForSelectAll.append(inputSelectAll);

    let imageCards = visibleImages.map((image, i) => {
      const imagePaths = image.split('/')
      return $(`
      <div id="image${i}" class="image-cards">
        <div class="image-tools">
          <span class="image_name_text" title="${image}">${imagePaths[imagePaths.length - 1]}</span>
          <img class="btn-open-img" src="${ls.icon_link}" data-url="${image}" />
          <img class="btn-download-img" src="${ls.icon_download}" data-url="${image}" />
        </div>
        <img src="${image}" title="${image}" />
      </div>`)
    })

    imagesContainer.append(imageCards)
  }

  function downloadImages() {
    startDownload();

    function startDownload() {
      let checkedImages = visibleImages.filter((images, i) => $('#image' + i).hasClass('checked'))
      ls.imageCount = checkedImages.length;
      ls.imageNumber = 1;
      checkedImages.forEach(checkedImage => {
        chrome.downloads.download({ url: checkedImage });
      });
    }
  }

  $(function () {
    initializePopup();
  });
}(localStorage));
