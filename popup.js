document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var currentTab = tabs[0];
    var actionButton = document.getElementById('actionButton');
    var downloadCsvButton = document.getElementById('downloadCsvButton');
    var resultsTable = document.getElementById('resultsTable');
    var filenameInput = document.getElementById('filenameInput');
    var message = document.getElementById('message');

    // Check if we are on a Google Maps search page
    if (currentTab && currentTab.url.includes("://www.google.com/maps/search")) {
      message.textContent = "Let's scrape Google Maps!";
      actionButton.disabled = false;
      actionButton.classList.add('enabled');
    } else {
      message.innerHTML = '';
      var link = document.createElement('a');
      link.href = 'https://www.google.com/maps/search/';
      link.textContent = "Go to Google Maps Search.";
      link.target = '_blank';
      message.appendChild(link);

      actionButton.style.display = 'none';
      downloadCsvButton.style.display = 'none';
      filenameInput.style.display = 'none';
    }

    // Scrape button click
    actionButton.addEventListener('click', function() {
      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: scrapeData
      }, function(results) {
        // Clear previous results
        while (resultsTable.firstChild) {
          resultsTable.removeChild(resultsTable.firstChild);
        }

        // Add table headers
        const headers = ['Title', 'Rating', 'Reviews', 'Phone', 'Industry', 'Address', 'Website', 'Google Maps Link'];
        const headerRow = document.createElement('tr');
        headers.forEach(text => {
          var th = document.createElement('th');
          th.textContent = text;
          headerRow.appendChild(th);
        });
        resultsTable.appendChild(headerRow);

        // No results guard
        if (!results || !results[0] || !results[0].result) return;

        // Add rows
        results[0].result.forEach(item => {
          var row = document.createElement('tr');
          ['title', 'rating', 'reviewCount', 'phone', 'industry', 'address', 'companyUrl', 'href'].forEach(key => {
            var cell = document.createElement('td');
            var val = item[key] || '';
            if (key === 'reviewCount') {
              val = val.replace(/\(|\)/g, ''); // clean review count parentheses
            }
            cell.textContent = val;
            row.appendChild(cell);
          });
          resultsTable.appendChild(row);
        });

        // Enable CSV download if data exists
        downloadCsvButton.disabled = results[0].result.length === 0;
      });
    });

    // Download CSV button click
    downloadCsvButton.addEventListener('click', function() {
      var csv = tableToCsv(resultsTable);
      var filename = filenameInput.value.trim();
      if (!filename) {
        filename = 'google-maps-data.csv';
      } else {
        filename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.csv';
      }
      downloadCsv(csv, filename);
    });
  });
});

// This function runs in the page context and scrapes the data
function scrapeData() {
  var links = Array.from(document.querySelectorAll('a[href^="https://www.google.com/maps/place"]'));
  return links.map(link => {
    var container = link.closest('[jsaction*="mouseover:pane"]');
    var titleText = container ? (container.querySelector('.fontHeadlineSmall')?.textContent || '') : '';
    var rating = '';
    var reviewCount = '';
    var phone = '';
    var industry = '';
    var address = '';
    var companyUrl = '';

    // Rating and Reviews
    if (container) {
      var roleImgContainer = container.querySelector('[role="img"]');
      if (roleImgContainer) {
        var ariaLabel = roleImgContainer.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.includes("stars")) {
          var parts = ariaLabel.split(' ');
          rating = parts[0];
          reviewCount = '(' + parts[2] + ')';
        } else {
          rating = '0';
          reviewCount = '0';
        }
      }
    }

    // Address and Industry extraction
    if (container) {
      var containerText = container.textContent || '';
      var addressRegex = /\d+ [\w\s]+(?:#\s*\d+|Suite\s*\d+|Apt\s*\d+)?/;
      var addressMatch = containerText.match(addressRegex);
      if (addressMatch) {
        address = addressMatch[0];

        var textBeforeAddress = containerText.substring(0, containerText.indexOf(address)).trim();
        var ratingIndex = textBeforeAddress.lastIndexOf(rating + reviewCount);
        if (ratingIndex !== -1) {
          var rawIndustryText = textBeforeAddress.substring(ratingIndex + (rating + reviewCount).length).trim().split(/[\r\n]+/)[0];
          industry = rawIndustryText.replace(/[·.,#!?]/g, '').trim();
        }

        var filterRegex = /\b(Closed|Open 24 hours|24 hours|Open)\b/g;
        address = address.replace(filterRegex, '').trim();
      } else {
        address = '';
      }
    }

    // Company URL extraction
    if (container) {
      var allLinks = Array.from(container.querySelectorAll('a[href]'));
      var filteredLinks = allLinks.filter(a => !a.href.startsWith("https://www.google.com/maps/place/"));
      if (filteredLinks.length > 0) {
        companyUrl = filteredLinks[0].href;
      }
    }

    // Phone extraction
    if (container) {
      var containerText = container.textContent || '';
      var phoneRegex = /(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
      var phoneMatch = containerText.match(phoneRegex);
      phone = phoneMatch ? phoneMatch[0] : '';
    }

    return {
      title: titleText,
      rating: rating,
      reviewCount: reviewCount,
      phone: phone,
      industry: industry,
      address: address,
      companyUrl: companyUrl,
      href: link.href,
    };
  });
}

// Converts an HTML table to CSV string
function tableToCsv(table) {
  var csv = [];
  var rows = table.querySelectorAll('tr');
  for (var i = 0; i < rows.length; i++) {
    var row = [], cols = rows[i].querySelectorAll('td, th');
    for (var j = 0; j < cols.length; j++) {
      row.push('"' + cols[j].innerText.replace(/"/g, '""') + '"');
    }
    csv.push(row.join(','));
  }
  return csv.join('\n');
}

// Downloads CSV file
function downloadCsv(csv, filename) {
  var csvFile = new Blob([csv], { type: 'text/csv' });
  var downloadLink = document.createElement('a');
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
