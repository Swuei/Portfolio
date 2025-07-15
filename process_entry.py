import json
import os
from bs4 import BeautifulSoup

def count_entries(column):
    return len(column.find_all('div', class_='download-item'))

def main():
    try:
        with open('payload.json') as f:
            payload = json.load(f)

        target_page = payload['targetPage']

        with open(target_page, 'r') as f:
            soup = BeautifulSoup(f, 'html.parser')

        columns = soup.find_all('div', class_='download-column')
        if len(columns) < 2:
            print('Error: Expected at least two download columns')
            return 1

        left_column, right_column = columns[0], columns[1]
        left_count = count_entries(left_column)
        right_count = count_entries(right_column)

        target_column = left_column if left_count <= right_count else right_column

        new_entry = f"""
        <div class="download-item">
            <div class="download-item-header">
                <h4>{payload["name"]}</h4>
                {'<span class="new-slider">(NEW!)</span>' if payload.get("isNew", False) else ''}
                {'<span class="animated-tag"><i class="fas fa-cogs"></i> Animated</span>' if payload.get("isAnimated", False) else ''}
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

        target_column.insert(0, BeautifulSoup(new_entry, 'html.parser'))

        with open(target_page, 'w') as f:
            f.write(str(soup))

        print('Successfully added entry to column with fewer items')
        return 0

    except Exception as e:
        print(f'Error processing entry: {str(e)}')
        return 1

if __name__ == '__main__':
    exit(main())
