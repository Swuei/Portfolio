import json
import os
from bs4 import BeautifulSoup

def count_entries(soup, column_class):
    column = soup.find('div', class_=column_class)
    if column:
        return len(column.find_all('div', class_='download-item'))
    return 0

def main():
    try:
        with open('payload.json') as f:
            payload = json.load(f)

        target_page = payload['targetPage']

        with open(target_page, 'r') as f:
            soup = BeautifulSoup(f, 'html.parser')

        left_count = count_entries(soup, 'download-column')
        right_count = count_entries(soup, 'download-column:last-child')

        target_column = 'download-column' if left_count <= right_count else 'download-column:last-child'
        download_column = soup.select_one(f'.{target_column}')

        if not download_column:
            print('Error: Could not find download-column div')
            return 1

        new_entry = f"""
        <div class="download-item">
            <div class="download-item-header">
                <h4>{payload["name"]}</h4>
                <span class="download-item-count" data-counter="{payload["counterName"]}">
                    <i class="fas fa-download"></i> <span>0</span>
                </span>
            </div>
            <div class="download-links">
                <a href="{payload["mediafireLink"]}" class="download-btn" target="_blank" data-download="true">
                    <i class="fas fa-file-archive"></i> Download ZIP
                </a>
                <a href="{payload["sketchfabLink"]}" class="download-btn" target="_blank">
                    <i class="fas fa-eye"></i> Preview
                </a>
            </div>
            <div class="download-meta">
                <span><i class="fas fa-file-archive"></i> {payload["fileSize"]}</span>
                <span><i class="fas fa-cube"></i> {payload["modelCount"]}</span>
                <span><i class="fas fa-calendar-alt"></i> {payload["uploadDate"]}</span>
            </div>
        </div>
        """

        download_column.insert(0, BeautifulSoup(new_entry, 'html.parser'))

        with open(target_page, 'w') as f:
            f.write(str(soup))

        print(f'Successfully added entry to {target_column}')
        return 0

    except Exception as e:
        print(f'Error processing entry: {str(e)}')
        return 1

if __name__ == '__main__':
    exit(main())
