<img width="1358" height="826" alt="Screenshot 2025-08-12 at 8 18 26 AM" src="https://github.com/user-attachments/assets/30bce7e4-1e41-4353-aaf2-ea7ffb305890" />

<img width="1186" height="813" alt="Screenshot 2025-08-12 at 8 18 42 AM" src="https://github.com/user-attachments/assets/dfad9750-d1c6-448a-bf95-cfb7ed07d11b" />

<img width="1168" height="929" alt="Screenshot 2025-08-12 at 8 19 04 AM" src="https://github.com/user-attachments/assets/3bb074fb-3ddc-4ca1-8ee7-af695fe06f37" />
Google Maps Easy Scraper
Overview
This project is a Chrome Extension that automates the extraction of business data directly from Google Maps search results. It scrapes key business attributes such as name, rating, review count, phone number, industry, address, website URL, and the Google Maps listing link. The scraped data is then displayed in a table within the extension popup and can be downloaded as a CSV file for further analysis or integration.

How It Works (Technical Details)
1. Extension Initialization
The extension popup script listens for the DOMContentLoaded event.

It uses chrome.tabs.query to detect the currently active tab in the user's Chrome browser.

It verifies if the current tab URL matches Google Maps search results (https://www.google.com/maps/search/...).

If the URL matches, it enables the "Scrape Google Maps" button; otherwise, it hides the controls and shows a link to navigate to Google Maps search.

2. User Interaction
The user clicks the Scrape Google Maps button.

This triggers chrome.scripting.executeScript which injects and executes the scrapeData function within the context of the current Google Maps tab.

3. Data Scraping (scrapeData function)
The function scans the page for all links pointing to Google Maps places using:

js
Copy
Edit
document.querySelectorAll('a[href^="https://www.google.com/maps/place"]')
For each link (each business listing):

It finds the nearest container element with attribute jsaction containing "mouseover:pane" which typically contains the detailed business info displayed in the side panel on hover or click.

Extracts:

Title: from the .fontHeadlineSmall class inside the container.

Rating & Review Count: from the [role="img"] element's aria-label, parsing star ratings and reviews count.

Phone Number: via regex searching for common phone formats in the container text.

Industry: parsed from text near rating/review, cleaned from punctuation.

Address: identified via regex matching typical street addresses in container text.

Website URL: filters links inside the container that do not link back to Google Maps places.

Google Maps Link: the href of the original place link.

Returns an array of objects containing these extracted properties.

4. Rendering Results in the Popup
The background script receives the array of business objects.

It clears any previous results and dynamically creates a table with headers and rows corresponding to the scraped data.

Enables the Download as CSV button if results exist.

5. Export to CSV
When the user clicks Download as CSV:

The current HTML table is converted to a CSV-formatted string.

Special characters and quotes are properly escaped.

A temporary downloadable Blob URL is created.

A hidden anchor element triggers the file download with the user-provided or default filename.

