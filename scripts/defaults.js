(function (ls) {
  'use strict';

  // Shows option page
  chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
      chrome.tabs.create({ url: '/views/options.html' });
    }
  });

  // Global
  ls.animation_duration = '500';

  // Popup
  let defaults = {
    // Filters
    folder_name: 'IMAGE_GRABBER/',
    new_file_name: '',
    filter_url: '',
    filter_url_mode: 'regex',
    show_url_filter: true,
    columns: 3,
    // Icons
    icon_link: '/images/open.png',
    icon_download: '/images/download.png'
  };

  for (let option in defaults) {
    if (ls[option] === undefined) ls[option] = defaults[option];
    ls[option + '_default'] = defaults[option];
  }

  ls.options = JSON.stringify(Object.keys(defaults));
}(localStorage));
