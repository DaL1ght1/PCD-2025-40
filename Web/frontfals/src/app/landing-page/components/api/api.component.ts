import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-api',
  templateUrl: './api.component.html',
  styleUrls: ['./api.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class ApiComponent {
  endpoints = [
    {
      category: 'Authentication',
      items: [
        { name: 'Generate API Key', method: 'POST', path: '/api/v1/auth/keys' },
        { name: 'Revoke API Key', method: 'DELETE', path: '/api/v1/auth/keys/{key_id}' }
      ]
    },
    {
      category: 'Images',
      items: [
        { name: 'Upload Image', method: 'POST', path: '/api/v1/images' },
        { name: 'Get Image', method: 'GET', path: '/api/v1/images/{image_id}' },
        { name: 'Delete Image', method: 'DELETE', path: '/api/v1/images/{image_id}' },
        { name: 'List Images', method: 'GET', path: '/api/v1/images' }
      ]
    },
    {
      category: 'Analysis',
      items: [
        { name: 'Start Analysis', method: 'POST', path: '/api/v1/analysis' },
        { name: 'Get Analysis', method: 'GET', path: '/api/v1/analysis/{analysis_id}' },
        { name: 'Cancel Analysis', method: 'DELETE', path: '/api/v1/analysis/{analysis_id}' }
      ]
    },
    {
      category: 'Reports',
      items: [
        { name: 'Generate Report', method: 'POST', path: '/api/v1/reports' },
        { name: 'Get Report', method: 'GET', path: '/api/v1/reports/{report_id}' },
        { name: 'List Reports', method: 'GET', path: '/api/v1/reports' }
      ]
    },
    {
      category: 'Cases',
      items: [
        { name: 'Create Case', method: 'POST', path: '/api/v1/cases' },
        { name: 'Get Case', method: 'GET', path: '/api/v1/cases/{case_id}' },
        { name: 'Update Case', method: 'PUT', path: '/api/v1/cases/{case_id}' },
        { name: 'Delete Case', method: 'DELETE', path: '/api/v1/cases/{case_id}' },
        { name: 'List Cases', method: 'GET', path: '/api/v1/cases' }
      ]
    },
    {
      category: 'Users',
      items: [
        { name: 'Create User', method: 'POST', path: '/api/v1/users' },
        { name: 'Get User', method: 'GET', path: '/api/v1/users/{user_id}' },
        { name: 'Update User', method: 'PUT', path: '/api/v1/users/{user_id}' },
        { name: 'Delete User', method: 'DELETE', path: '/api/v1/users/{user_id}' },
        { name: 'List Users', method: 'GET', path: '/api/v1/users' }
      ]
    }
  ];

  codeExamples = {
    curl: `curl -X POST https://api.fids.io/v1/images \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@/path/to/image.jpg" \\
  -F "case_id=case_12345"`,

    python: `import requests

url = "https://api.fids.io/v1/images"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}
files = {
    "image": open("/path/to/image.jpg", "rb")
}
data = {
    "case_id": "case_12345"
}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())`,

    javascript: `const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('image', fs.createReadStream('/path/to/image.jpg'));
form.append('case_id', 'case_12345');

fetch('https://api.fids.io/v1/images', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: form
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`
  };

  selectedLanguage = 'curl';

  setLanguage(language: string) {
    this.selectedLanguage = language;
  }
}
